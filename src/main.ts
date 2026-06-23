/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from "@iobroker/adapter-core";
import * as luxtronik from "luxtronik2";
import { dumpAllRawToLog, readAllRaw } from "./rawFunctions";
import { STATE_MAPPING } from "./stateMapping";
import {
	calculateTemperatureSpread,
	calculateTotalEnergy,
	calculateTotalThermalEnergy,
	initializeVirtualStates,
	updateErrorHistory,
	updateOutageHistory,
} from "./virtualStates";

class Lwd50a extends utils.Adapter {
	private pollingInterval?: NodeJS.Timeout;
	private pump: any;
	private createdStates = new Set<string>();
	private lastBzVal = "";
	private zipTimer?: NodeJS.Timeout;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "lwd50a",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	private async onReady(): Promise<void> {
		const ip = this.config.host;
		const port = this.config.port || 8889;

		this.log.info(`Verbinde mit Wärmepumpe auf ${ip}:${port}...`);
		this.pump = new luxtronik.createConnection(ip, port);

		// Alle virtuellen Datenpunkte aus dem Mapping vorab generieren
		await initializeVirtualStates(this);

		// Erste Abfrage sofort starten
		await this.updateData();

		// Intervall aus der Konfiguration (Minimum 10 Sekunden)
		let intervalSeconds = this.config.interval || 30;
		if (intervalSeconds < 10) {
			intervalSeconds = 10;
			this.log.warn("Eingestelltes Intervall war zu kurz. Wurde zum Schutz auf 10 Sekunden korrigiert.");
		}

		this.log.info(`Starte Polling-Intervall. Lese Daten und optimiere alle ${intervalSeconds} Sekunden.`);

		this.pollingInterval = setInterval(() => {
			void this.updateData();
		}, intervalSeconds * 1000);
	}

	// =========================================================
	// SKRIPT-OPTIMIERUNG: HILFSFUNKTIONEN & SCHEDULE
	// =========================================================

	/**
	 * Setzt einen eigenen State nur, wenn der Wert abweicht oder noch nicht existiert.
	 * Verhindert unnötige Schreibbefehle (Traffic) an die Wärmepumpe.
	 *
	 * @param id ID des zu setzenden Datenpunkts
	 * @param val Neuer Wert für den Datenpunkt
	 * @param ack Ack-Flag für den State
	 */
	private async setOwnStateIfDifferent(id: string, val: any, ack = false): Promise<void> {
		try {
			if (val === undefined) {
				return;
			}

			const state = await this.getStateAsync(id);
			if (!state || state.val !== val) {
				await this.setState(id, { val: val, ack: ack });
			}
		} catch (err: any) {
			this.log.error(`Fehler in setOwnStateIfDifferent für ${id}: ${err.message}`);
		}
	}

	/**
	 * Prüft, ob der letzte Wechsel des Anlagenstatus länger als 10 Minuten her ist.
	 */
	private async istAnlageAelterAls10Min(): Promise<boolean> {
		try {
			const state = await this.getStateAsync("Informationen.08_Betriebszustand.WP_BZ_akt");
			const lastChange = state?.lc ?? 0;
			return (Date.now() - lastChange) / 60000 >= 10;
		} catch {
			return false;
		}
	}

	/**
	 * Führt die Überwachung und dynamische Anpassung der Heizkurve/HUP aus.
	 * Wird automatisch am Ende von updateData() aufgerufen.
	 */
	private async runOptimizationSchedule(): Promise<void> {
		try {
			// =========================================================
			// HAUPTSCHALTER FÜR DIE REGELUNG
			// =========================================================
			const regelungAktiv = await this.getStateAsync("Aktionen.Regelung_Aktiv");

			// Wenn der Schalter explizit vom Nutzer ausgeschaltet wurde,
			// brechen wir hier sofort ab und machen nichts!
			if (regelungAktiv?.val === false) {
				return;
			}

			// 1. STATUS ABFRAGEN (Weiche)
			const bzState = await this.getStateAsync("Informationen.08_Betriebszustand.WP_BZ_akt");
			const bzVal = bzState && bzState.val ? String(bzState.val).trim() : "";

			const istHeizen = bzVal === "Heizen";
			const istWarmwasser = bzVal === "Warmwasser";
			const istLeerlauf = bzVal === "Leerlauf";
			const istAbtauen = bzVal === "Abtauen";

			if (!istHeizen && !istWarmwasser && !istLeerlauf && !istAbtauen) {
				return;
			}

			// =========================================================
			// VORGABEWERTE BEI BETRIEBSMODUS-WECHSEL SEAMLESS SETZEN
			// =========================================================
			if (bzVal !== this.lastBzVal) {
				this.log.debug(
					`Betriebsmodus gewechselt von '${this.lastBzVal}' zu '${bzVal}'. Setze Vorgabewerte aus Instanz-Konfiguration...`,
				);

				const configWithDynamicKeys = this.config as Record<string, any>;

				if (istLeerlauf) {
					await this.setOwnStateIfDifferent(
						"Einstellungen.02_Heizung.heating_curve_end_point",
						configWithDynamicKeys.endpunkt,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.02_Heizung.heating_curve_parallel_offset",
						configWithDynamicKeys.fusspunkt,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.04_Pumpe.heating_system_circ_pump_voltage_minimal",
						configWithDynamicKeys.sync_heating_system_circ_pump_voltage_minimal,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.04_Pumpe.heating_system_circ_pump_voltage_nominal",
						configWithDynamicKeys.sync_heating_system_circ_pump_voltage_nominal,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.03_Warmwasser.warmwater_temperature",
						configWithDynamicKeys.sync_warmwater_target_temperature,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.03_Warmwasser.hotWaterTemperatureHysteresis",
						configWithDynamicKeys.sync_hotwater_temperature_hysteresis,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.02_Heizung.returnTemperatureHysteresis",
						configWithDynamicKeys.sync_return_temperature_hysteresis,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.05_ZIP.zip_aktiv",
						configWithDynamicKeys.zip_aktiv,
						false,
					);

					await this.setOwnStateIfDifferent("Einstellungen.02_Heizung.Heizen_nach_Wasser", false, true);
				} else if (istHeizen) {
					await this.setOwnStateIfDifferent(
						"Einstellungen.05_ZIP.zip_aktiv",
						configWithDynamicKeys.zip_aktiv,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.04_Pumpe.heating_system_circ_pump_voltage_minimal",
						configWithDynamicKeys.sync_heating_system_circ_pump_voltage_minimal,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.04_Pumpe.heating_system_circ_pump_voltage_nominal",
						configWithDynamicKeys.sync_heating_system_circ_pump_voltage_nominal,
						false,
					);

					await this.setOwnStateIfDifferent("Einstellungen.02_Heizung.Heizen_nach_Wasser", true, true);
				} else if (istWarmwasser) {
					await this.setOwnStateIfDifferent(
						"Einstellungen.03_Warmwasser.hotWaterTemperatureHysteresis",
						configWithDynamicKeys.hysterese_ww,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.05_ZIP.zip_aktiv",
						configWithDynamicKeys.zip_aktiv_ww,
						false,
					);
					await this.setOwnStateIfDifferent(
						"Einstellungen.04_HUP.heating_system_circ_pump_voltage_nominal",
						10,
						false,
					);
					await this.setOwnStateIfDifferent("Einstellungen.05_ZIP.Activate_Zip", true, false);
				} else if (istAbtauen) {
					await this.setOwnStateIfDifferent(
						"Einstellungen.04_Pumpe.heating_system_circ_pump_voltage_nominal",
						10,
						false,
					);
				}

				this.lastBzVal = bzVal;
			}

			// =========================================================
			// 2. ALLE WERTE ZENTRAL EINMALIG ABRUFEN (DRY-Prinzip)
			// =========================================================
			const wwSoll =
				((await this.getStateAsync("Informationen.01_Temperaturen.Wamwassertemperatur_Soll"))?.val as number) ??
				0;
			const wwIst =
				((await this.getStateAsync("Informationen.01_Temperaturen.Warmwassertemperatur"))?.val as number) ?? 0;
			const ruecklauf =
				((await this.getStateAsync("Informationen.01_Temperaturen.Rücklauf"))?.val as number) ?? 0;

			const spreizung =
				((await this.getStateAsync("Informationen.01_Temperaturen.spreizung_vorlauf_ruecklauf"))
					?.val as number) ?? 0;
			const heatingStateStr = String(
				(await this.getStateAsync("Informationen.08_Betriebszustand.opStateHeatingString"))?.val || "",
			).trim();
			const vd1 = (await this.getStateAsync("Informationen.03_Ausgaenge.VD1out"))?.val === true;

			const wwHysterese =
				((await this.getStateAsync("Einstellungen.03_Warmwasser.hotWaterTemperatureHysteresis"))
					?.val as number) ?? 0;
			const ruecklaufSoll =
				((await this.getStateAsync("Informationen.01_Temperaturen.temperature_target_return"))
					?.val as number) ?? 0;
			const hupAktiv = ((await this.getStateAsync("Informationen.03_Ausgaenge.HUPout"))?.val as number) ?? 0;
			const heizenHysterese =
				((await this.getStateAsync("Einstellungen.02_Heizung.returnTemperatureHysteresis"))?.val as number) ??
				0;
			const betriebsart =
				((await this.getStateAsync("Informationen.08_Betriebszustand.WP_BZ_akt"))?.val as number) ?? 0;

			const nachWasserState = await this.getStateAsync("Einstellungen.02_Heizung.Heizen_nach_Wasser");
			const nachWasser = nachWasserState?.val;

			const aelterAls10 = await this.istAnlageAelterAls10Min();

			// =========================================================
			// 3. REINE REGEL-LOGIK (FORTLAUFENDES POLLING IM BETRIEB)
			// =========================================================

			if (istHeizen) {
				// Spreizung & Fußpunkt-Anpassung
				if (aelterAls10 && vd1) {
					const fusspunkt = (
						await this.getStateAsync("Einstellungen.02_Heizung.heating_curve_parallel_offset")
					)?.val;
					if (fusspunkt === 35) {
						const configWithDynamicKeys = this.config as Record<string, any>;
						await this.setOwnStateIfDifferent(
							"Einstellungen.02_Heizung.heating_curve_parallel_offset",
							configWithDynamicKeys.fusspunkt,
							false,
						);
					}
				}

				// HUP Regelung
				if (spreizung < 6.5 && hupAktiv > 5.5) {
					await this.setOwnStateIfDifferent("Informationen.03_Ausgaenge.HUPout", hupAktiv - 0.25, false);
				} else if (spreizung > 7.5) {
					await this.setOwnStateIfDifferent("Informationen.03_Ausgaenge.HUPout", hupAktiv + 0.25, false);
				}

				// Nachheizen Regelung
				if (ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
					if (aelterAls10) {
						await this.setOwnStateIfDifferent("Einstellungen.02_Heizung.Heizen_nach_Wasser", false, true);
					}
				} else {
					if (!nachWasser) {
						await this.setOwnStateIfDifferent("Einstellungen.02_Heizung.Heizen_nach_Wasser", true, true);
					}
				}

				// Wasser Hysterese Boost
				if (wwSoll - wwIst > 2 && ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
					this.log.debug("Starte WW Erzeugung nach Heizung");
					await this.setOwnStateIfDifferent(
						"Einstellungen.03_Warmwasser.hotWaterTemperatureHysteresis",
						2,
						false,
					);
				}
			}

			if (istWarmwasser) {
				if (nachWasser) {
					await this.setOwnStateIfDifferent(
						"Einstellungen.02_Heizung.heating_curve_parallel_offset",
						35,
						false,
					);
				}
			}

			if (istLeerlauf) {
				if (
					wwSoll - wwIst >= wwHysterese - 1.5 &&
					ruecklauf <= ruecklaufSoll &&
					betriebsart !== 4 &&
					heatingStateStr !== "Heizgrenze"
				) {
					await this.setOwnStateIfDifferent(
						"Einstellungen.02_Heizung.heating_curve_parallel_offset",
						35,
						false,
					);
				}
			}
		} catch (err: any) {
			this.log.error(`Fehler im runOptimizationSchedule-Ablauf: ${err.message}`);
		}
	}

	private formatSecondsToHMS(totalSeconds: number): string {
		if (totalSeconds < 0 || isNaN(totalSeconds)) {
			return "00:00:00";
		}
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}

	private readPumpAsync(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.pump.read((err: any, data: any): void => {
				if (err) {
					reject(err instanceof Error ? err : new Error(String(err)));
				} else {
					resolve(data);
				}
			});
		});
	}

	private writePumpAsync(cmd: string | number, val: any, isRaw = false): Promise<void> {
		return new Promise((resolve, reject) => {
			const cb = (err: any): void => {
				if (err) {
					reject(err instanceof Error ? err : new Error(String(err)));
				} else {
					resolve();
				}
			};

			if (isRaw) {
				this.pump.writeRaw(cmd, val, cb);
			} else {
				this.pump.write(cmd, val, cb);
			}
		});
	}

	private async updateData(): Promise<void> {
		if (!this.pump) {
			this.log.error("Abfrage abgebrochen: Keine aktive Verbindung zur Wärmepumpe vorhanden.");
			return;
		}

		try {
			const [rawParams, rawValues, coolchipData] = await Promise.all([
				readAllRaw(this, 3003).catch(err => {
					this.log.debug(`Raw-Parameter (3003) nicht verfügbar: ${err.message}`);
					return [] as number[];
				}),
				readAllRaw(this, 3004).catch(err => {
					this.log.debug(`Raw-Messwerte (3004) nicht verfügbar: ${err.message}`);
					return [] as number[];
				}),
				this.readPumpAsync().catch(err => {
					if (err.message?.toLowerCase().includes("busy")) {
						this.log.warn("Wärmepumpe ist ausgelastet (busy). Überspringe diesen Abfrage-Zyklus.");
					} else {
						this.log.error(`Verbindungsfehler beim Einlesen der Daten: ${err.message}`);
					}
					return null;
				}),
			]);

			if (!coolchipData) {
				return;
			}

			for (const [key, definition] of Object.entries(STATE_MAPPING)) {
				if (definition.isVirtual) {
					continue;
				}

				const configWithDynamicKeys = this.config as Record<string, any>;
				if (configWithDynamicKeys[`sync_${key}`] === false) {
					continue;
				}

				const luxId = definition.luxWriteId || key;
				let value: any = undefined;

				if (definition.dataSource) {
					switch (definition.dataSource) {
						case "raw_parameter": {
							const index = parseInt(luxId, 10);
							if (!isNaN(index) && rawParams?.[index] !== undefined) {
								value = rawParams[index];
								if (definition.factor) {
									value /= definition.factor;
								}
							}
							break;
						}
						case "raw_value": {
							const index = parseInt(luxId, 10);
							if (!isNaN(index) && rawValues?.[index] !== undefined) {
								value = rawValues[index];
								if (definition.factor) {
									value /= definition.factor;
								}
							}
							break;
						}
						case "parameter":
							value = coolchipData?.parameters?.[luxId];
							break;
						case "value":
							value = coolchipData?.values?.[luxId];
							break;
						case "additional":
							value = coolchipData?.additional?.[luxId];
							break;
					}
				} else {
					const isRawNumber = /^\d+$/.test(luxId);
					if (isRawNumber) {
						const index = parseInt(luxId, 10);
						if (!isNaN(index)) {
							if (definition.folder.startsWith("Einstellungen") && rawParams?.[index] !== undefined) {
								value = rawParams[index];
							} else if (
								definition.folder.startsWith("Informationen") &&
								rawValues?.[index] !== undefined
							) {
								value = rawValues[index];
							}
							if (value !== undefined && typeof value === "number" && definition.factor) {
								value = value / definition.factor;
							}
						}
					} else {
						value =
							coolchipData?.values?.[luxId] ??
							coolchipData?.parameters?.[luxId] ??
							coolchipData?.additional?.[luxId];
					}
				}

				if (value !== undefined) {
					if (definition.type === "number" && typeof value === "string") {
						const textVal = value.toLowerCase();
						value = textVal === "ein" ? 1 : textVal === "aus" ? 0 : parseFloat(value);
					} else if (definition.type === "boolean") {
						if (typeof value === "string") {
							const textVal = value.toLowerCase();
							value = textVal === "ein" || textVal === "true" || textVal === "1";
						} else {
							value = value === true || value === 1;
						}
					} else if (definition.type === "json" && typeof value === "object") {
						value = JSON.stringify(value);
					}

					let targetType: ioBroker.CommonType = definition.type === "json" ? "string" : definition.type;
					let targetRole = definition.role;
					let targetUnit = definition.unit;

					if (definition.unit === "s") {
						const totalSeconds = typeof value === "number" ? value : parseInt(value, 10);
						if (!isNaN(totalSeconds)) {
							value = this.formatSecondsToHMS(totalSeconds);
							targetType = "string";
							targetRole = "text";
							targetUnit = undefined;
						}
					} else if (definition.role === "value.datetime") {
						const totalSeconds = typeof value === "number" ? value : parseInt(value, 10);
						if (!isNaN(totalSeconds) && totalSeconds >= 0) {
							if (totalSeconds < 86400) {
								const h = Math.floor(totalSeconds / 3600)
									.toString()
									.padStart(2, "0");
								const m = Math.floor((totalSeconds % 3600) / 60)
									.toString()
									.padStart(2, "0");
								value = `${h}:${m}`;
							} else {
								value = new Date(totalSeconds * 1000).toLocaleString("de-DE");
							}
							targetType = "string";
							targetUnit = undefined;
						}
					}

					const folderId = definition.folder;
					const stateId = `${folderId}.${key}`;

					if (!this.createdStates.has(stateId)) {
						await this.setObjectNotExists(folderId, {
							type: "channel",
							common: { name: folderId.split(".").pop() || folderId },
							native: {},
						});

						await this.setObjectNotExists(stateId, {
							type: "state",
							common: {
								name: definition.name,
								type: targetType,
								role: targetRole,
								unit: targetUnit,
								read: true,
								write: definition.write || false,
								min: definition.min,
								max: definition.max,
								states: definition.states,
							},
							native: {},
						});

						if (definition.write) {
							this.subscribeStates(stateId);
						}
						this.createdStates.add(stateId);
					}

					await this.setStateChangedAsync(stateId, { val: value, ack: true });
				}
			}

			await calculateTotalThermalEnergy(this);
			await calculateTotalEnergy(this);
			await updateErrorHistory(this, rawValues);
			await updateOutageHistory(this, rawValues);
			await calculateTemperatureSpread(this);

			// Synchroner Aufruf der Optimierungs- und Modus-Wechsel-Logik
			await this.runOptimizationSchedule();
		} catch (catchErr: any) {
			this.log.error(`Fehler im updateData-Ablauf: ${catchErr.message}`);
		}
	}

	private onUnload(callback: () => void): void {
		try {
			if (this.pollingInterval) {
				clearInterval(this.pollingInterval);
				this.pollingInterval = undefined;
				this.log.info("Polling-Intervall erfolgreich gestoppt.");
			}

			if (this.pump && typeof this.pump.disconnect === "function") {
				this.pump.disconnect();
			}

			if (this.zipTimer) {
				clearTimeout(this.zipTimer);
				this.zipTimer = undefined;
			}

			this.log.info("Adapter wurde sauber beendet.");
			callback();
		} catch (err: any) {
			this.log.error(`Fehler beim Beenden des Adapters: ${err.message}`);
			callback();
		}
	}

	private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
		if (!state || state.ack) {
			if (!state) {
				this.log.info(`State ${id} wurde gelöscht.`);
			}
			return;
		}

		this.log.info(`Nutzerbefehl empfangen für ${id}: ${state.val}`);

		const mappingKey = id.split(".").pop();
		if (!mappingKey) {
			this.log.warn(`Ungültiger State-Schlüssel aus ID extrahiert: ${id}`);
			return;
		}

		const definition = STATE_MAPPING[mappingKey];
		if (!definition) {
			this.log.warn(`Kein Mapping für ${mappingKey} gefunden.`);
			return;
		}

		try {
			if (mappingKey === "Regelung_Aktiv") {
				this.log.info(`Interner Schalter betätigt: Regelung ist nun ${state.val ? "AKTIV" : "PAUSIERT"}`);
				await this.setState(id, { val: state.val, ack: true });
				return;
			}

			if (mappingKey === "zip_aktiv") {
				this.log.info(`Zip Dauer auf ${state.val} geändert`);
				await this.setState(id, { val: state.val, ack: true });
				return;
			}

			if (mappingKey === "Dump_Raw_To_Log") {
				if (state.val === true) {
					this.log.info("Manueller Raw-Dump über Datenpunkt getriggert...");
					await dumpAllRawToLog(this);
					await this.setState(id, { val: false, ack: true });
				}
				return;
			}

			if (mappingKey === "Activate_Zip") {
				if (state.val === true) {
					// 1. Dauer auslesen
					const durationState = await this.getStateAsync("Einstellungen.05_ZIP.zip_aktiv");
					const durationSeconds =
						durationState && typeof durationState.val === "number" ? durationState.val : 120;

					if (durationSeconds <= 0) {
						this.log.warn("ZIP Makro abgebrochen: Die eingestellte Dauer ist 0 oder ungültig.");
						await this.setState(id, { val: false, ack: true });
						return;
					}

					// 2. Prüfen, ob die ZIP laut Hardware (ZIPout) oder Software (zipTimer) bereits läuft
					const zipOutState = await this.getStateAsync("Informationen.03_Ausgaenge.ZIPout");
					const isAlreadyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;

					if (isAlreadyRunning || this.zipTimer) {
						// Pumpe läuft schon -> Laufzeit verlängern, keine Hardware-Befehle senden
						this.log.info(
							`ZIP ist bereits aktiv (ZIPout). Setze den Abschalt-Timer neu auf ${durationSeconds} Sekunden.`,
						);

						if (this.zipTimer) {
							clearTimeout(this.zipTimer);
							this.zipTimer = undefined;
						}
					} else {
						// Pumpe steht -> Normal starten und Hardware-Befehle senden
						this.log.info(
							`Makro gestartet: ZIP Entlüftung wird für ${durationSeconds} Sekunden aktiviert...`,
						);

						await this.writePumpAsync("runDeaerate", 1);
						await new Promise(resolve => setTimeout(resolve, 1000));
						await this.writePumpAsync("hotWaterCircPumpDeaerate", 1);
					}

					// Schalter auf true bestätigen und Werte aktualisieren
					await this.setState(id, { val: true, ack: true });
					await this.updateData();

					// 3. Den Timer für die automatische Abschaltung (neu) starten
					this.zipTimer = setTimeout(async () => {
						this.log.info("ZIP Entlüftung: Zeit abgelaufen. Deaktiviere Pumpe...");
						try {
							await this.writePumpAsync("runDeaerate", 0);
							await new Promise(resolve => setTimeout(resolve, 1000));
							await this.writePumpAsync("hotWaterCircPumpDeaerate", 0);

							await this.setState(id, { val: false, ack: true });
							await this.updateData();
						} catch (err: any) {
							this.log.error(`Fehler beim automatischen Deaktivieren der ZIP: ${err.message}`);
						}
						this.zipTimer = undefined;
					}, durationSeconds * 1000);
				} else {
					// Manueller Abbruch durch den User (Schalter in der VIS auf "false" gesetzt)
					this.log.info("Makro manuell abgebrochen: Deaktiviere ZIP Entlüftung sofort...");

					if (this.zipTimer) {
						clearTimeout(this.zipTimer);
						this.zipTimer = undefined;
					}

					await this.writePumpAsync("runDeaerate", 0);
					await new Promise(resolve => setTimeout(resolve, 1000));
					await this.writePumpAsync("hotWaterCircPumpDeaerate", 0);

					await this.setState(id, { val: false, ack: true });
					await this.updateData();
				}

				return;
			}

			if (!definition.luxWriteId || definition.write !== true) {
				this.log.warn(`Kein Schreib-Mapping für ${mappingKey} vorhanden oder erlaubt.`);
				return;
			}

			if (typeof state.val === "number") {
				if (definition.min !== undefined && state.val < definition.min) {
					this.log.warn(`Wert ${state.val} unterschreitet Minimum von ${definition.min}. Abgebrochen.`);
					return;
				}
				if (definition.max !== undefined && state.val > definition.max) {
					this.log.warn(`Wert ${state.val} überschreitet Maximum von ${definition.max}. Abgebrochen.`);
					return;
				}
			}

			let valueToWrite: any = state.val;

			if (definition.role === "value.datetime") {
				const valStr = String(state.val).trim();

				const timeMatch = valStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
				const dateMatch = valStr.match(
					/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/,
				);

				if (timeMatch) {
					const hour = parseInt(timeMatch[1], 10);
					const minute = parseInt(timeMatch[2], 10);
					const second = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
					valueToWrite = hour * 3600 + minute * 60 + second;
				} else if (dateMatch) {
					const day = parseInt(dateMatch[1], 10);
					const month = parseInt(dateMatch[2], 10) - 1;
					const year = parseInt(dateMatch[3], 10);
					const hour = parseInt(dateMatch[4], 10);
					const minute = parseInt(dateMatch[5], 10);
					const second = dateMatch[6] ? parseInt(dateMatch[6], 10) : 0;
					const date = new Date(year, month, day, hour, minute, second);
					valueToWrite = Math.floor(date.getTime() / 1000);
				} else if (/^\d+$/.test(valStr)) {
					valueToWrite = parseInt(valStr, 10);
				} else {
					this.log.error(
						`Ungültiges Format für ${id}: ${state.val}. Erwartet wird "HH:MM" oder "TT.MM.JJJJ, HH:MM"`,
					);
					return;
				}
			} else if (definition.factor && typeof state.val === "number") {
				valueToWrite = state.val * definition.factor;
			}

			const luxWriteId = definition.luxWriteId;

			const isRawWrite =
				definition.dataSource === "raw_parameter" ||
				definition.dataSource === "raw_value" ||
				(!definition.dataSource && /^\d+$/.test(luxWriteId || ""));

			if (isRawWrite && definition.unit === "°C" && !definition.factor && typeof state.val === "number") {
				this.log.info(`Raw-Temperatur erkannt. Multipliziere Wert ${state.val} mit Faktor 10 für Luxtronik.`);
				valueToWrite = state.val * 10;
			}

			if (isRawWrite) {
				const paramId = parseInt(luxWriteId, 10);
				this.log.info(`Sende RAW-NUMBER an Luxtronik: ID ${paramId} = ${valueToWrite}`);
				await this.writePumpAsync(paramId, valueToWrite, true);
			} else {
				this.log.info(`Sende STANDARD-STRING an Luxtronik: Name "${luxWriteId}" = ${valueToWrite}`);
				await this.writePumpAsync(luxWriteId, valueToWrite, false);
			}

			this.log.info(`Wert ${state.val} erfolgreich via [${luxWriteId}] an Wärmepumpe übertragen.`);

			await this.setState(id, { val: state.val, ack: true });
			await new Promise(resolve => setTimeout(resolve, 500));
			await this.updateData();
		} catch (err: any) {
			this.log.error(`Fehler bei der Befehlsausführung: ${err.message}`);
		}
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Lwd50a(options);
} else {
	(() => new Lwd50a())();
}

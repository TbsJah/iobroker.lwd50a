/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from "@iobroker/adapter-core";
import * as luxtronik from "luxtronik2";
import { dumpAllRawToLog, readAllRaw } from "./rawFunctions";
import { STATE_MAPPING, getDpPath } from "./stateMapping";
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
	private isDebugLogActive = false;
	private updateRunning = false;
	private originalZipConfig: Record<string, any> | null = null; // Backup der Zirkulationstabelle

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

		// 1. WICHTIG: Vorab alle Objekte erzeugen, damit setState funktioniert!
		await this.ensureAllObjectsExist();

		// 2. Alle virtuellen Datenpunkte aus dem Mapping vorab generieren
		await initializeVirtualStates(this);

		// Einmaliges Einlesen des Schalters beim Adapterstart
		const debugState = await this.getStateAsync(getDpPath("Schreibe_Debug_Log"));
		this.isDebugLogActive = debugState?.val === true;

		// 3. Konfigurationswerte SOFORT aus der jsonConfig übernehmen
		if (this.isDebugLogActive) {
			this.log.info("Synchronisiere Konfigurationswerte mit den ioBroker-Objekten...");
		}
		await this.setIdleDefaults();

		// Fremde States für Bewegungsmelder abonnieren
		const sensorKeys = ["ZIP_Bewegung_Pfad_1", "ZIP_Bewegung_Pfad_2", "ZIP_Bewegung_Pfad_3"] as const;
		for (const key of sensorKeys) {
			const s = await this.getStateAsync(getDpPath(key));
			if (s && s.val && typeof s.val === "string" && s.val.length > 0) {
				this.subscribeForeignStates(s.val);
			}
		}

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
	 * Erzeugt alle strukturellen Zustände aus dem State-Mapping vorab in der Datenbank.
	 */
	private async ensureAllObjectsExist(): Promise<void> {
		try {
			for (const [key, definition] of Object.entries(STATE_MAPPING)) {
				if (definition.isVirtual) {
					continue;
				}
				const stateId = `${definition.folder}.${key}`;

				if (!this.createdStates.has(stateId)) {
					await this.setObjectNotExistsAsync(definition.folder, {
						type: "channel",
						common: { name: definition.folder.split(".").pop() || definition.folder },
						native: {},
					});

					let targetType: ioBroker.CommonType = definition.type === "json" ? "string" : definition.type;
					if (definition.unit === "s" && definition.type === "number") {
						targetType = "string";
					}

					await this.setObjectNotExistsAsync(stateId, {
						type: "state",
						common: {
							name: definition.name,
							type: targetType,
							role: definition.role,
							unit: definition.unit,
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
			}
		} catch (err: any) {
			this.log.error(`Fehler bei der Vorab-Objekterzeugung: ${err.message}`);
		}
	}

	/**
	 * Setzt einen eigenen State synchron via setState, wenn der Wert abweicht.
	 *
	 * @param id Die Objekt-ID des zu setzenden States.
	 * @param val Der Wert, der gesetzt werden soll.
	 * @param ack True, wenn der Wert als bestätigt gesetzt werden soll.
	 */
	private async setOwnStateIfDifferent(id: string, val: any, ack = false): Promise<void> {
		try {
			if (val === undefined) {
				return;
			}

			const state = await this.getStateAsync(id);
			if (!state || state.val !== val) {
				await this.setState(id, { val: val, ack: ack });
				if (this.isDebugLogActive) {
					this.log.debug(`Setze Werte für ${id}: ${val}`);
				}
			}
		} catch (err: any) {
			this.log.error(`Fehler in setOwnStateIfDifferent für ${id}: ${err.message}`);
		}
	}

	/**
	 * Setzt alle Anlageparameter auf die Standardwerte (Leerlauf) aus der Instanzkonfiguration zurück.
	 */
	private async setIdleDefaults(): Promise<void> {
		try {
			const configWithDynamicKeys = this.config as Record<string, any>;

			await this.setOwnStateIfDifferent(
				getDpPath("heating_curve_end_point"),
				configWithDynamicKeys.endpunkt,
				false,
			);
			await this.setOwnStateIfDifferent(
				getDpPath("heating_curve_parallel_offset"),
				configWithDynamicKeys.fusspunkt,
				false,
			);
			await this.setOwnStateIfDifferent(
				getDpPath("heating_system_circ_pump_voltage_minimal"),
				configWithDynamicKeys.sync_heating_system_circ_pump_voltage_minimal_heating,
				false,
			);
			await this.setOwnStateIfDifferent(
				getDpPath("heating_system_circ_pump_voltage_nominal"),
				configWithDynamicKeys.sync_heating_system_circ_pump_voltage_nominal_heating,
				false,
			);
			await this.setOwnStateIfDifferent(
				getDpPath("warmwater_temperature"),
				configWithDynamicKeys.sync_warmwater_target_temperature,
				false,
			);
			await this.setOwnStateIfDifferent(
				getDpPath("hotWaterTemperatureHysteresis"),
				configWithDynamicKeys.sync_hotwater_temperature_hysteresis,
				false,
			);
			await this.setOwnStateIfDifferent(
				getDpPath("returnTemperatureHysteresis"),
				configWithDynamicKeys.sync_return_temperature_hysteresis,
				false,
			);
			await this.setOwnStateIfDifferent(getDpPath("zip_aktiv"), configWithDynamicKeys.zip_aktiv, false);
			await this.setOwnStateIfDifferent(
				getDpPath("Heizen_nach_Wasser"),
				configWithDynamicKeys.Heating_after_warmwater ?? false,
				true,
			);
		} catch (err: any) {
			this.log.error(`Fehler beim Setzen der Leerlauf-Vorgabewerte: ${err.message}`);
		}
	}

	/**
	 * Stellt die gesicherte ZIP Zirkulationstabelle wieder her.
	 */
	private async restoreOriginalZipConfig(): Promise<void> {
		if (!this.originalZipConfig) {
			return;
		}

		try {
			for (const [key, val] of Object.entries(this.originalZipConfig)) {
				if (val === null || val === undefined) {
					continue;
				}

				const def = STATE_MAPPING[key];
				let rawVal = val;

				if (def.role === "value.datetime" && typeof val === "string") {
					const timeMatch = val.match(/^(\d{1,2}):(\d{1,2})/);
					if (timeMatch) {
						rawVal = parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60;
					} else {
						rawVal = 0;
					}
				}

				const luxId = parseInt(def.luxWriteId!, 10);
				await this.writePumpAsync(luxId, rawVal, true);
				await new Promise(resolve => setTimeout(resolve, 100)); // Kurze Pause für die WP
				await this.setState(getDpPath(key as any), { val: val, ack: true });
			}
		} catch (err: any) {
			this.log.error(`Fehler bei der Wiederherstellung der ZIP Konfiguration: ${err.message}`);
		} finally {
			this.originalZipConfig = null; // Backup löschen
		}
	}

	/**
	 * Prüft, ob das ZIP-Makro oder das Entlüftungsprogramm noch läuft und beendet es sicher.
	 */
	private async stopZipAndDeaeration(): Promise<void> {
		try {
			const activateZipState = await this.getStateAsync(getDpPath("Activate_Zip"));
			const runDeaerateState = await this.getStateAsync(getDpPath("runDeaerate"));

			const isZipActive = activateZipState?.val === true || this.zipTimer || this.originalZipConfig !== null;
			const isDeaerateActive = runDeaerateState?.val === 1 || runDeaerateState?.val === true;

			if (isZipActive || isDeaerateActive) {
				if (this.isDebugLogActive) {
					this.log.info("Bedingungen erfüllt: Stoppe aktives ZIP Makro und Entlüftungsprogramm...");
				}

				if (this.zipTimer) {
					clearTimeout(this.zipTimer);
					this.zipTimer = undefined;
				}

				await this.restoreOriginalZipConfig();

				await this.writePumpAsync(158, 0, true);
				await new Promise(resolve => setTimeout(resolve, 100));
				await this.writePumpAsync(684, 0, true);
				await new Promise(resolve => setTimeout(resolve, 100));

				await this.setOwnStateIfDifferent(getDpPath("runDeaerate"), 0, true);
				await this.setOwnStateIfDifferent(getDpPath("hotWaterCircPumpDeaerate"), 0, true);
				await this.setOwnStateIfDifferent(getDpPath("Activate_Zip"), false, true);
			}
		} catch (err: any) {
			this.log.error(`Fehler beim Stoppen von ZIP/Entlüftung: ${err.message}`);
		}
	}

	private async istAnlageAelterAls10Min(): Promise<boolean> {
		try {
			const state = await this.getStateAsync(getDpPath("WP_BZ_akt"));
			const lastChange = state?.lc ?? 0;
			return (Date.now() - lastChange) / 60000 >= 10;
		} catch {
			return false;
		}
	}

	/**
	 * Führt die Überwachung und dynamische Anpassung der Heizkurve/HUP aus.
	 */
	private async runOptimizationSchedule(): Promise<void> {
		try {
			const regelungAktiv = await this.getStateAsync(getDpPath("Regelung_Aktiv"));
			if (regelungAktiv?.val === false) {
				return;
			}

			const bzState = await this.getStateAsync(getDpPath("WP_BZ_akt"));
			const bzVal = bzState && bzState.val !== null ? String(bzState.val).trim() : "";

			const istHeizen = bzVal === "0";
			const istWarmwasser = bzVal === "1";
			const istAbtauen = bzVal === "4";
			const istLeerlauf = bzVal === "5";

			if (!istHeizen && !istWarmwasser && !istLeerlauf && !istAbtauen) {
				return;
			}

			// Vorgabewerte bei Moduswechsel SOFORT setzen (Erststart-Sperre entfernt!)
			if (bzVal !== this.lastBzVal) {
				const config = this.config as Record<string, any>;
				if (istLeerlauf) {
					await this.setIdleDefaults();
				} else if (istHeizen) {
					await this.setOwnStateIfDifferent(getDpPath("zip_aktiv"), config.zip_aktiv, false);
					await this.setOwnStateIfDifferent(
						getDpPath("heating_system_circ_pump_voltage_minimal"),
						config.sync_heating_system_circ_pump_voltage_minimal_heating,
						false,
					);
					await this.setOwnStateIfDifferent(
						getDpPath("heating_system_circ_pump_voltage_nominal"),
						config.sync_heating_system_circ_pump_voltage_nominal_heating,
						false,
					);
					await this.setOwnStateIfDifferent(
						getDpPath("Heizen_nach_Wasser"),
						config.Heating_after_warmwater ?? true,
						true,
					);
				} else if (istWarmwasser) {
					await this.setOwnStateIfDifferent(
						getDpPath("hotWaterTemperatureHysteresis"),
						config.sync_hotwater_temperature_hysteresis,
						false,
					);
					await this.setOwnStateIfDifferent(getDpPath("zip_aktiv"), config.zip_aktiv_ww, false);
					await this.setOwnStateIfDifferent(
						getDpPath("heating_system_circ_pump_voltage_minimal"),
						config.sync_heating_system_circ_pump_voltage_minimal_water,
						false,
					);
					await this.setOwnStateIfDifferent(
						getDpPath("heating_system_circ_pump_voltage_nominal"),
						config.sync_heating_system_circ_pump_voltage_nominal_water,
						false,
					);
					await this.setOwnStateIfDifferent(getDpPath("Activate_Zip"), true, false);
				} else if (istAbtauen) {
					await this.setOwnStateIfDifferent(getDpPath("heating_system_circ_pump_voltage_nominal"), 10, false);
				}
				this.lastBzVal = bzVal;
			}

			const [
				wwSollState,
				wwIstState,
				ruecklaufState,
				spreizungState,
				heatingStateStrState,
				vd1State,
				wwHystereseState,
				ruecklaufSollState,
				hupAktivState,
				heizenHystereseState,
				nachWasserState,
				aelterAls10,
			] = await Promise.all([
				this.getStateAsync(getDpPath("Wamwassertemperatur_Soll")),
				this.getStateAsync(getDpPath("Wamwassertemperatur_Ist")),
				this.getStateAsync(getDpPath("temperature_return")),
				this.getStateAsync(getDpPath("spreizung_vorlauf_ruecklauf")),
				this.getStateAsync(getDpPath("opStateHeatingString")),
				this.getStateAsync(getDpPath("VD1out")),
				this.getStateAsync(getDpPath("hotWaterTemperatureHysteresis")),
				this.getStateAsync(getDpPath("temperature_target_return")),
				this.getStateAsync(getDpPath("HUPout")),
				this.getStateAsync(getDpPath("returnTemperatureHysteresis")),
				this.getStateAsync(getDpPath("Heizen_nach_Wasser")),
				this.istAnlageAelterAls10Min(),
			]);

			const wwSoll = (wwSollState?.val as number) ?? 0;
			const wwIst = (wwIstState?.val as number) ?? 0;
			const ruecklauf = (ruecklaufState?.val as number) ?? 0;
			const spreizung = (spreizungState?.val as number) ?? 0;
			const heatingStateStr = String(heatingStateStrState?.val || "").trim();
			const vd1 = vd1State?.val === 1;
			const wwHysterese = (wwHystereseState?.val as number) ?? 0;
			const ruecklaufSoll = (ruecklaufSollState?.val as number) ?? 0;
			const hupAktiv = (hupAktivState?.val as number) ?? 0;
			const heizenHysterese = (heizenHystereseState?.val as number) ?? 0;
			const nachWasser = nachWasserState?.val;
			const betriebsart = (bzState?.val as number) ?? 0;

			if (istHeizen) {
				if (aelterAls10 && vd1) {
					const fusspunkt = (await this.getStateAsync(getDpPath("heating_curve_parallel_offset")))?.val;
					if (fusspunkt === 35) {
						const config = this.config as Record<string, any>;
						await this.setOwnStateIfDifferent(
							getDpPath("heating_curve_parallel_offset"),
							config.fusspunkt,
							false,
						);
					}
				}

				if (spreizung < 6.5 && hupAktiv > 5.5) {
					await this.setOwnStateIfDifferent(getDpPath("HUPout"), hupAktiv - 0.25, false);
				} else if (spreizung > 7.5) {
					await this.setOwnStateIfDifferent(getDpPath("HUPout"), hupAktiv + 0.25, false);
				}

				if (ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
					if (aelterAls10) {
						await this.setOwnStateIfDifferent(getDpPath("Heizen_nach_Wasser"), false, true);
					}
				} else if (!nachWasser) {
					await this.setOwnStateIfDifferent(getDpPath("Heizen_nach_Wasser"), true, true);
				}

				if (wwSoll - wwIst > 2 && ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
					await this.setOwnStateIfDifferent(getDpPath("hotWaterTemperatureHysteresis"), 2, false);
				}
			}

			if (istWarmwasser && nachWasser) {
				await this.setOwnStateIfDifferent(getDpPath("heating_curve_parallel_offset"), 35, false);
			}

			if (istLeerlauf) {
				if (wwIst <= wwSoll - wwHysterese || ruecklauf <= ruecklaufSoll - heizenHysterese) {
					await this.stopZipAndDeaeration();
				}

				if (
					wwSoll - wwIst >= wwHysterese - 1.5 &&
					ruecklauf <= ruecklaufSoll &&
					betriebsart !== 4 &&
					heatingStateStr !== "Heizgrenze"
				) {
					await this.setOwnStateIfDifferent(getDpPath("heating_curve_parallel_offset"), 35, false);
				}
			}
		} catch (err: any) {
			this.log.error(`Fehler im runOptimizationSchedule-Ablauf: ${err.message}`);
		}
	}

	private readPumpAsync(): Promise<any> {
		if (this.isDebugLogActive) {
			this.log.debug(`readPumpAsync Comand`);
		}
		return new Promise((resolve, reject) => {
			let isFinished = false;
			const timeout = setTimeout(() => {
				if (isFinished) {
					return;
				}
				isFinished = true;
				reject(new Error("Timeout (35s): Luxtronik hat keine Antwort geliefert."));
			}, 35000);

			this.pump.read((err: any, data: any): void => {
				if (isFinished) {
					return;
				}
				isFinished = true;
				clearTimeout(timeout);
				if (err) {
					reject(err instanceof Error ? err : new Error(String(err)));
				} else {
					resolve(data);
				}
			});
		});
	}

	private writePumpAsync(cmd: string | number, val: any, isRaw = false): Promise<void> {
		if (this.isDebugLogActive) {
			this.log.debug(`writePumpAsync Comand: ${cmd}, val: ${val}`);
		}
		return new Promise((resolve, reject) => {
			let isFinished = false;
			const timeout = setTimeout(() => {
				if (isFinished) {
					return;
				}
				isFinished = true;
				reject(new Error(`Timeout (35s) beim Schreiben von [${cmd}].`));
			}, 35000);

			const cb = (err: any): void => {
				if (isFinished) {
					return;
				}
				isFinished = true;
				clearTimeout(timeout);
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

	private formatSecondsToHMS(totalSeconds: number): string {
		if (totalSeconds < 0 || isNaN(totalSeconds)) {
			return "00:00:00";
		}
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = Math.floor(totalSeconds % 60);

		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}

	private async updateData(): Promise<void> {
		if (this.updateRunning) {
			return;
		}
		this.updateRunning = true;
		try {
			let rawParams: number[] = [];
			let rawValues: number[] = [];
			let coolchipData: any = null;

			try {
				rawParams = await readAllRaw(this, 3003);
			} catch (err: any) {
				this.log.debug(`Raw 3003 Fehler: ${err.message}`);
			}
			await new Promise(r => setTimeout(r, 3500));

			try {
				rawValues = await readAllRaw(this, 3004);
			} catch (err: any) {
				this.log.debug(`Raw 3004 Fehler: ${err.message}`);
			}
			await new Promise(r => setTimeout(r, 3500));

			try {
				coolchipData = await this.readPumpAsync();
			} catch (err: any) {
				if (err.message.includes("Timeout")) {
					this.log.debug("Wärmepumpe ausgelastet (Timeout). Der Abfrage-Zyklus wird übersprungen.");
				} else {
					this.log.error(`Verbindungsfehler: ${err.message}`);
				}
			}

			if (!coolchipData) {
				return;
			}

			for (const [key, definition] of Object.entries(STATE_MAPPING)) {
				if (definition.isVirtual) {
					continue;
				}
				const config = this.config as Record<string, any>;
				if (config[`sync_${key}`] === false) {
					continue;
				}

				const luxId = definition.luxWriteId || key;
				let value: any = undefined;

				if (definition.dataSource) {
					switch (definition.dataSource) {
						case "raw_parameter":
							value = rawParams?.[parseInt(luxId, 10)];
							if (value !== undefined && definition.factor) {
								value /= definition.factor;
							}
							break;
						case "raw_value":
							value = rawValues?.[parseInt(luxId, 10)];
							if (value !== undefined && definition.factor) {
								value /= definition.factor;
							}
							break;
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
					if (/^\d+$/.test(luxId)) {
						const idx = parseInt(luxId, 10);
						value = definition.folder.startsWith("Einstellungen") ? rawParams?.[idx] : rawValues?.[idx];
						if (value !== undefined && definition.factor) {
							value /= definition.factor;
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
						value =
							value.toLowerCase() === "ein" ? 1 : value.toLowerCase() === "aus" ? 0 : parseFloat(value);
					} else if (definition.type === "boolean") {
						value =
							value === true ||
							value === 1 ||
							String(value).toLowerCase() === "ein" ||
							String(value).toLowerCase() === "true";
					} else if (definition.type === "json" && typeof value === "object") {
						value = JSON.stringify(value);
					}

					// targetType wurde hier entfernt!

					if (definition.unit === "s" && typeof value === "number") {
						value = this.formatSecondsToHMS(value);
						// targetType = "string" wurde hier entfernt!
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
							// targetType = "string" wurde hier entfernt!
						}
					}

					const stateId = `${definition.folder}.${key}`;
					// Objekt wird jetzt sicher durch ensureAllObjectsExist verwaltet, setState genügt!
					await this.setState(stateId, { val: value, ack: true });
				}
			}

			await calculateTotalThermalEnergy(this);
			await calculateTotalEnergy(this);
			await updateErrorHistory(this, rawValues);
			await updateOutageHistory(this, rawValues);
			await calculateTemperatureSpread(this);

			await this.runOptimizationSchedule();
		} catch (err: any) {
			this.log.error(`Fehler im updateData-Ablauf: ${err.message}`);
		} finally {
			this.updateRunning = false;
		}
	}

	private onUnload(callback: () => void): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
		}
		if (this.pump && typeof this.pump.disconnect === "function") {
			this.pump.disconnect();
		}
		if (this.zipTimer) {
			clearTimeout(this.zipTimer);
		}
		callback();
	}

	private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
		if (!state) {
			return;
		}

		const sensorKeys = ["ZIP_Bewegung_Pfad_1", "ZIP_Bewegung_Pfad_2", "ZIP_Bewegung_Pfad_3"] as const;
		for (const key of sensorKeys) {
			const pathState = await this.getStateAsync(getDpPath(key));
			const path = pathState?.val as string;

			if (path && path.length > 0 && id === path && state.val === true) {
				const now = Date.now();
				const zipOutState = await this.getStateAsync(getDpPath("ZIPout"));
				const lastZipChange = zipOutState?.lc || 0;
				const configWithDynamicKeys = this.config as Record<string, any>;

				if (now - lastZipChange > configWithDynamicKeys.zip_last_run_min * 1000) {
					if (this.isDebugLogActive) {
						this.log.debug(
							`Bewegung an ${path} erkannt. Letzte ZIP-Aktion (Hardware) ist über 10 Min her. Triggere ZIP Makro.`,
						);
					}
					await this.setState(getDpPath("Activate_Zip"), { val: true, ack: false });
				}
				return;
			}
		}

		if (state.ack) {
			return;
		}

		const mappingKey = id.split(".").pop();
		if (!mappingKey) {
			return;
		}
		const definition = STATE_MAPPING[mappingKey];
		if (!definition) {
			return;
		}

		try {
			if (mappingKey === "Schreibe_Debug_Log") {
				this.isDebugLogActive = state.val === true;
				await this.setState(id, { val: state.val, ack: true });
				return;
			}
			if (
				mappingKey === "Regelung_Aktiv" ||
				mappingKey === "zip_aktiv" ||
				mappingKey.startsWith("ZIP_Bewegung_Pfad_")
			) {
				await this.setState(id, { val: state.val, ack: true });
				return;
			}
			if (mappingKey === "Setze_Vorgabewerte" && state.val === true) {
				await this.setIdleDefaults();
				await this.setState(id, { val: false, ack: true });
				return;
			}
			if (mappingKey === "Dump_Raw_To_Log" && state.val === true) {
				await dumpAllRawToLog(this);
				await this.setState(id, { val: false, ack: true });
				return;
			}

			if (mappingKey === "Activate_Zip") {
				if (state.val === true) {
					const durationState = await this.getStateAsync(getDpPath("zip_aktiv"));
					const durationSeconds =
						durationState && typeof durationState.val === "number" ? durationState.val : 120;

					if (durationSeconds <= 0) {
						await this.setState(id, { val: false, ack: true });
						return;
					}

					const bzState = await this.getStateAsync(getDpPath("WP_BZ_akt"));
					const bzVal = bzState ? Number(bzState.val) : 5;

					const [wwIstS, wwSollS, wwHystS, rLState, rSollState, hzHystState] = await Promise.all([
						this.getStateAsync(getDpPath("Wamwassertemperatur_Ist")),
						this.getStateAsync(getDpPath("Wamwassertemperatur_Soll")),
						this.getStateAsync(getDpPath("hotWaterTemperatureHysteresis")),
						this.getStateAsync(getDpPath("temperature_return")),
						this.getStateAsync(getDpPath("temperature_target_return")),
						this.getStateAsync(getDpPath("returnTemperatureHysteresis")),
					]);

					const useDeaeration =
						bzVal === 5 &&
						Number(wwIstS?.val) > Number(wwSollS?.val) - Number(wwHystS?.val) &&
						Number(rLState?.val) > Number(rSollState?.val) - Number(hzHystState?.val);

					if (this.zipTimer) {
						clearTimeout(this.zipTimer);
						this.zipTimer = undefined;
					}

					if (useDeaeration) {
						await this.writePumpAsync(158, 1, true);
						await new Promise(r => setTimeout(r, 100));
						await this.writePumpAsync(684, 1, true);
						await this.setOwnStateIfDifferent(getDpPath("runDeaerate"), 1, true);
						await this.setOwnStateIfDifferent(getDpPath("hotWaterCircPumpDeaerate"), 1, true);
					} else {
						const onTimeMinutes = Math.ceil(durationSeconds / 60);
						if (!this.originalZipConfig) {
							const keysToSave = [
								"hotWaterCircPumpTimerTableSelected",
								"WW_MoSo_Start1",
								"WW_MoSo_End1",
								"WW_MoSo_Start2",
								"WW_MoSo_End2",
								"WW_MoSo_Start3",
								"WW_MoSo_End3",
								"WW_MoSo_Start4",
								"WW_MoSo_End4",
								"WW_MoSo_Start5",
								"WW_MoSo_End5",
								"hotWaterCircPumpOnTime",
								"hotWaterCircPumpOffTime",
							] as const;
							this.originalZipConfig = {};
							for (const k of keysToSave) {
								const s = await this.getStateAsync(getDpPath(k));
								this.originalZipConfig[k] = s ? s.val : null;
							}
						}

						const updates = [
							{ key: "hotWaterCircPumpTimerTableSelected", raw: 0 },
							{ key: "WW_MoSo_Start1", raw: 0 },
							{ key: "WW_MoSo_End1", raw: 86340 },
							{ key: "WW_MoSo_Start2", raw: 0 },
							{ key: "WW_MoSo_End2", raw: 0 },
							{ key: "hotWaterCircPumpOnTime", raw: onTimeMinutes },
							{ key: "hotWaterCircPumpOffTime", raw: 60 },
						];

						for (const u of updates) {
							await this.writePumpAsync(parseInt(STATE_MAPPING[u.key].luxWriteId!, 10), u.raw, true);
							await new Promise(r => setTimeout(r, 100));
						}
					}

					await this.setState(id, { val: true, ack: true });
					this.zipTimer = setTimeout(async () => {
						await this.stopZipAndDeaeration();
					}, durationSeconds * 1000);
				} else {
					await this.stopZipAndDeaeration();
				}
				return;
			}

			if (!definition.luxWriteId || definition.write !== true) {
				return;
			}
			let valueToWrite: any = state.val;

			if (definition.role === "value.datetime") {
				const valStr = String(state.val).trim();
				const timeMatch = valStr.match(/^(\d{1,2}):(\d{1,2})/);
				if (timeMatch) {
					valueToWrite = parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60;
				}
			} else if (definition.factor && typeof state.val === "number") {
				valueToWrite = state.val * definition.factor;
			}

			const isRawWrite =
				definition.dataSource === "raw_parameter" ||
				definition.dataSource === "raw_value" ||
				(!definition.dataSource && /^\d+$/.test(definition.luxWriteId || ""));
			if (isRawWrite && definition.unit === "°C" && typeof state.val === "number" && !definition.factor) {
				valueToWrite = state.val * 10;
			}

			await this.writePumpAsync(
				isRawWrite ? parseInt(definition.luxWriteId, 10) : definition.luxWriteId,
				valueToWrite,
				isRawWrite,
			);
			await this.setState(id, { val: state.val, ack: true });
		} catch (err: any) {
			this.log.error(`Fehler bei Befehlsausführung: ${err.message}`);
		}
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Lwd50a(options);
} else {
	(() => new Lwd50a())();
}

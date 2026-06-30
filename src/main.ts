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

	/**
	 * NEU: Schreibt einen Fehler ins Log UND sendet (falls aktiviert) eine Telegram-Nachricht
	 *
	 * @param message Fehlermeldung, die protokolliert und optional per Telegram versendet werden soll
	 */
	private logAndNotifyError(message: string): void {
		// 1. Immer ins normale ioBroker-Log schreiben
		this.log.error(message);

		// 2. Prüfen, ob Telegram aktiviert ist
		const config = this.config as Record<string, any>;
		if (config.telegram_aktiv && config.telegram_instance) {
			const sendObj: Record<string, any> = {
				text: `⚠️ *Wärmepumpe Fehler*\n${message}`,
			};

			// Falls ein spezifischer Empfänger eingetragen wurde
			if (config.telegram_receiver && config.telegram_receiver.trim() !== "") {
				sendObj.user = config.telegram_receiver.trim();
			}

			// Nachricht an die gewählte Telegram-Instanz übergeben
			this.sendTo(config.telegram_instance, "send", sendObj);

			if (this.isDebugLogActive) {
				this.log.debug(`Telegram-Fehlermeldung gesendet an ${config.telegram_instance}`);
			}
		}
	}

	private async onReady(): Promise<void> {
		const ip = this.config.host;
		const port = this.config.port || 8889;

		this.log.info(`Verbinde mit Wärmepumpe auf ${ip}:${port}...`);
		this.pump = new luxtronik.createConnection(ip, port);

		// Vorab alle Objekte erzeugen, damit setState funktioniert
		await this.ensureAllObjectsExist();

		// Alle virtuellen Datenpunkte aus dem Mapping vorab generieren
		await initializeVirtualStates(this);

		// Einmaliges Einlesen des Schalters beim Adapterstart
		const debugState = await this.getStateAsync(getDpPath("Schreibe_Debug_Log"));
		this.isDebugLogActive = debugState?.val === true;

		// Konfigurationswerte SOFORT aus der jsonConfig übernehmen (Direkter Write an WP)
		if (this.isDebugLogActive) {
			this.log.info("Synchronisiere Konfigurationswerte mit der Wärmepumpe...");
		}
		await this.setIdleDefaults();

		// Dynamische Bewegungssensoren aus der Tabelle abonnieren
		const config = this.config as Record<string, any>;
		if (config.motionSensors && Array.isArray(config.motionSensors)) {
			for (const sensor of config.motionSensors) {
				if (sensor.oid && typeof sensor.oid === "string" && sensor.oid.trim() !== "") {
					this.subscribeForeignStates(sensor.oid.trim());
					if (this.isDebugLogActive) {
						this.log.info(`Bewegungssensor abonniert: ${sensor.name} (${sensor.oid})`);
					}
				}
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
			this.logAndNotifyError(`Fehler bei der Vorab-Objekterzeugung: ${err.message}`);
		}
	}

	private async syncConfigValue(mappingKey: keyof typeof STATE_MAPPING, val: any): Promise<void> {
		if (val === undefined || val === null) {
			return;
		}

		const id = getDpPath(mappingKey);
		const state = await this.getStateAsync(id);

		if (!state || state.val !== val) {
			const definition = STATE_MAPPING[mappingKey];
			if (!definition) {
				return;
			}

			if (this.isDebugLogActive) {
				this.log.info(`Schreibe Wert direkt in Wärmepumpe: ${mappingKey} = ${val}`);
			}

			if (definition.write === true && !definition.isVirtual && definition.luxWriteId) {
				let valueToWrite: any = val;

				if (definition.factor && typeof val === "number") {
					valueToWrite = val * definition.factor;
				}
				const isRawWrite =
					definition.dataSource === "raw_parameter" ||
					definition.dataSource === "raw_value" ||
					(!definition.dataSource && /^\d+$/.test(definition.luxWriteId || ""));

				if (isRawWrite && definition.unit === "°C" && typeof val === "number" && !definition.factor) {
					valueToWrite = val * 10;
				}

				try {
					const writeId = isRawWrite ? parseInt(definition.luxWriteId, 10) : definition.luxWriteId;
					await this.writePumpAsync(writeId, valueToWrite, isRawWrite);
					await new Promise(r => setTimeout(r, 200));
				} catch (err: any) {
					this.logAndNotifyError(`Fehler beim Schreiben von ${mappingKey} an die Pumpe: ${err.message}`);
				}
			}

			await this.setState(id, { val: val, ack: true });
		}
	}

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
			this.logAndNotifyError(`Fehler in setOwnStateIfDifferent für ${id}: ${err.message}`);
		}
	}

	private async setIdleDefaults(): Promise<void> {
		try {
			const config = this.config as Record<string, any>;
			await this.syncConfigValue("heating_curve_end_point", config.endpunkt);
			await this.syncConfigValue("heating_curve_parallel_offset", config.fusspunkt);
			await this.syncConfigValue(
				"heating_system_circ_pump_voltage_minimal",
				config.sync_heating_system_circ_pump_voltage_minimal_heating,
			);
			await this.syncConfigValue(
				"heating_system_circ_pump_voltage_nominal",
				config.sync_heating_system_circ_pump_voltage_nominal_heating,
			);
			await this.syncConfigValue("warmwater_temperature", config.sync_warmwater_target_temperature);
			await this.syncConfigValue("hotWaterTemperatureHysteresis", config.sync_hotwater_temperature_hysteresis);
			await this.syncConfigValue("returnTemperatureHysteresis", config.sync_return_temperature_hysteresis);
			await this.syncConfigValue("zip_aktiv", config.zip_aktiv);
			await this.syncConfigValue("Heizen_nach_Wasser", config.Heating_after_warmwater ?? false);
		} catch (err: any) {
			this.logAndNotifyError(`Fehler beim Setzen der Leerlauf-Vorgabewerte: ${err.message}`);
		}
	}

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
				await new Promise(resolve => setTimeout(resolve, 100));
				await this.setState(getDpPath(key), { val: val, ack: true });
			}
		} catch (err: any) {
			this.logAndNotifyError(`Fehler bei der Wiederherstellung der ZIP Konfiguration: ${err.message}`);
		} finally {
			this.originalZipConfig = null;
		}
	}

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

				await this.syncConfigValue("runDeaerate", 0);
				await this.syncConfigValue("hotWaterCircPumpDeaerate", 0);
				await this.setOwnStateIfDifferent(getDpPath("Activate_Zip"), false, true);
			}
		} catch (err: any) {
			this.logAndNotifyError(`Fehler beim Stoppen von ZIP/Entlüftung: ${err.message}`);
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

			const config = this.config as Record<string, any>;

			if (bzVal !== this.lastBzVal) {
				if (istLeerlauf) {
					await this.setIdleDefaults();
				} else if (istHeizen) {
					await this.syncConfigValue("zip_aktiv", config.zip_aktiv);
					await this.syncConfigValue(
						"heating_system_circ_pump_voltage_minimal",
						config.sync_heating_system_circ_pump_voltage_minimal_heating,
					);
					await this.syncConfigValue(
						"heating_system_circ_pump_voltage_nominal",
						config.sync_heating_system_circ_pump_voltage_nominal_heating,
					);
					await this.syncConfigValue("Heizen_nach_Wasser", config.Heating_after_warmwater === true);
				} else if (istWarmwasser) {
					await this.syncConfigValue(
						"hotWaterTemperatureHysteresis",
						config.sync_hotwater_temperature_hysteresis,
					);
					await this.syncConfigValue("zip_aktiv", config.zip_aktiv_ww);
					await this.syncConfigValue(
						"heating_system_circ_pump_voltage_minimal",
						config.sync_heating_system_circ_pump_voltage_minimal_water,
					);
					await this.syncConfigValue(
						"heating_system_circ_pump_voltage_nominal",
						config.sync_heating_system_circ_pump_voltage_nominal_water,
					);
					await this.setOwnStateIfDifferent(getDpPath("Activate_Zip"), true, false);
				} else if (istAbtauen) {
					await this.syncConfigValue("heating_system_circ_pump_voltage_nominal", 10);
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
						await this.syncConfigValue("heating_curve_parallel_offset", config.fusspunkt);
					}
				}

				if (spreizung < 6.5 && hupAktiv > 5.5) {
					await this.syncConfigValue("heating_system_circ_pump_voltage_nominal", hupAktiv - 0.25);
				} else if (spreizung > 7.5) {
					await this.syncConfigValue("heating_system_circ_pump_voltage_nominal", hupAktiv + 0.25);
				}

				if (ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
					if (aelterAls10) {
						await this.syncConfigValue("Heizen_nach_Wasser", false);
					}
				} else if (!nachWasser && config.Heating_after_warmwater === true) {
					await this.syncConfigValue("Heizen_nach_Wasser", true);
				}

				if (wwSoll - wwIst > 2 && ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
					await this.syncConfigValue("hotWaterTemperatureHysteresis", 2);
				}
			}

			if (istWarmwasser && nachWasser) {
				await this.syncConfigValue("heating_curve_parallel_offset", 35);
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
					await this.syncConfigValue("heating_curve_parallel_offset", 35);
				}
			}
		} catch (err: any) {
			this.logAndNotifyError(`Fehler im runOptimizationSchedule-Ablauf: ${err.message}`);
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
				// Timeouts sind völlig normal, hier feuern wir absichtlich keine Telegram-Meldung!
				if (err.message.includes("Timeout")) {
					this.log.debug("Wärmepumpe ausgelastet (Timeout). Der Abfrage-Zyklus wird übersprungen.");
				} else {
					// Bei "echten" Verbindungsfehlern senden wir eine Meldung
					this.logAndNotifyError(`Verbindungsfehler zur Wärmepumpe: ${err.message}`);
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

					if (definition.unit === "s" && typeof value === "number") {
						value = this.formatSecondsToHMS(value);
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
						}
					}

					const stateId = `${definition.folder}.${key}`;
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
			this.logAndNotifyError(`Fehler im updateData-Ablauf: ${err.message}`);
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

		const config = this.config as Record<string, any>;

		// =========================================================
		// 1. EXTERNE SENSOREN (Dynamisch aus der Konfigurations-Tabelle)
		// =========================================================
		if (config.motionSensors && Array.isArray(config.motionSensors)) {
			// Prüfen, ob die geänderte ID in unserer Sensor-Tabelle steht
			const matchedSensor = config.motionSensors.find((s: any) => s.oid && s.oid.trim() === id);

			if (matchedSensor && state.val === true) {
				const now = Date.now();
				const zipOutState = await this.getStateAsync(getDpPath("ZIPout"));
				const lastZipChange = zipOutState?.lc || 0;

				if (now - lastZipChange > (config.zip_last_run_min || 600) * 1000) {
					if (this.isDebugLogActive) {
						this.log.debug(
							`Bewegung an '${matchedSensor.name || id}' erkannt. Letzte ZIP-Aktion ist alt genug. Triggere ZIP Makro.`,
						);
					}
					// Makro als NUTZERBEFEHL (ack: false) triggern
					await this.setState(getDpPath("Activate_Zip"), { val: true, ack: false });
				} else {
					if (this.isDebugLogActive) {
						this.log.debug(
							`Bewegung an '${matchedSensor.name || id}' erkannt, aber ZIP hat kürzlich gearbeitet.`,
						);
					}
				}
				// Nach einem erkannten Bewegungsmelder zwingend abbrechen!
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
						await this.syncConfigValue("runDeaerate", 1);
						await this.syncConfigValue("hotWaterCircPumpDeaerate", 1);
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
			this.logAndNotifyError(`Fehler bei Befehlsausführung: ${err.message}`);
		}
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Lwd50a(options);
} else {
	(() => new Lwd50a())();
}

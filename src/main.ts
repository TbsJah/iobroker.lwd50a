/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from "@iobroker/adapter-core";
import * as luxtronik from "luxtronik2";
import * as net from "net";
import { STATE_MAPPING } from "./stateMapping";
import {
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

		// Einmaligen kompletten Log-Dump anstoßen
		void this.dumpAllRawToLog();

		// Intervall aus der Konfiguration (Minimum 10 Sekunden)
		let intervalSeconds = this.config.interval || 30;
		if (intervalSeconds < 10) {
			intervalSeconds = 10;
			this.log.warn("Eingestelltes Intervall war zu kurz. Wurde zum Schutz auf 10 Sekunden korrigiert.");
		}

		this.log.info(`Starte Polling-Intervall. Lese Daten alle ${intervalSeconds} Sekunden aus.`);

		this.pollingInterval = setInterval(() => {
			void this.updateData();
		}, intervalSeconds * 1000);
	}

	private async dumpAllRawToLog(): Promise<void> {
		try {
			const dumpList = async (command: number, title: string): Promise<void> => {
				this.log.info("=======================================================");
				this.log.info(`START COMPACT RAW DUMP: LISTE ${command} (${title})`);
				this.log.info("=======================================================");
				const data = await this.readAllRaw(command);
				for (let i = 0; i < data.length; i++) {
					this.log.info(`[RAW ${command}] Index ${i.toString().padStart(3, " ")} = ${data[i]}`);
				}
				this.log.info(`--- ENDE LISTE ${command} (Insgesamt ${data.length} Indizes geloggt) ---`);
				this.log.info("=======================================================");
			};

			await dumpList(3003, "PARAMETER");
			await dumpList(3004, "MESSWERTE");
		} catch (err: any) {
			this.log.error(`Fehler beim Ausführen des Raw-Dumps: ${err.message}`);
		}
	}

	private readAllRaw(command: number): Promise<number[]> {
		return new Promise((resolve, reject) => {
			const client = new net.Socket();
			const host = this.config.host;
			const port = 8888;

			let responseData = Buffer.alloc(0);

			client.connect(port, host, () => {
				const buffer = Buffer.alloc(8);
				buffer.writeInt32BE(command, 0);
				buffer.writeInt32BE(0, 4);
				client.write(buffer);
			});

			client.on("data", (chunk: Buffer) => {
				responseData = Buffer.concat([responseData, chunk]);

				const is3004 = command === 3004;
				const headerSize = is3004 ? 12 : 8;
				const lengthOffset = is3004 ? 8 : 4;

				if (responseData.length >= headerSize) {
					const responseCommand = responseData.readInt32BE(0);

					if (responseCommand === command) {
						const totalItems = responseData.readInt32BE(lengthOffset);
						const totalRequiredLength = headerSize + totalItems * 4;

						if (responseData.length >= totalRequiredLength) {
							const allValues: number[] = [];
							for (let i = 0; i < totalItems; i++) {
								const valueOffset = headerSize + i * 4;
								allValues.push(responseData.readInt32BE(valueOffset));
							}
							client.destroy();
							resolve(allValues);
						}
					}
				}
			});

			client.on("error", (err: Error) => {
				client.destroy();
				reject(err);
			});

			client.setTimeout(8000);
			client.on("timeout", () => {
				client.destroy();
				reject(new Error(`Timeout beim Auslesen der kompletten Liste ${command}.`));
			});
		});
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
			// Echte Parallelisierung: Alle 3 Datenquellen gleichzeitig abfragen
			const [rawParams, rawValues, coolchipData] = await Promise.all([
				this.readAllRaw(3003).catch(err => {
					this.log.debug(`Raw-Parameter (3003) nicht verfügbar: ${err.message}`);
					return [] as number[];
				}),
				this.readAllRaw(3004).catch(err => {
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

				// =========================================================
				// STRATEGIE 1: ABSOLUT PRÄZISE WEICHE ANHAND DER DATA_SOURCE
				// =========================================================
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
					// =========================================================
					// STRATEGIE 2: ABWÄRTSKOMPATIBLER FALLBACK (Heuristik)
					// =========================================================
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

				// --- Formatierung & Typenkorrektur ---
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
						// --- DATETIME AUSLESEN (Uhrzeit oder Unix-Timestamp) ---
						const totalSeconds = typeof value === "number" ? value : parseInt(value, 10);
						if (!isNaN(totalSeconds) && totalSeconds >= 0) {
							if (totalSeconds < 86400) {
								// Weniger als 24 Stunden = Reine Uhrzeit (z.B. Timer-Einstellung)
								const h = Math.floor(totalSeconds / 3600)
									.toString()
									.padStart(2, "0");
								const m = Math.floor((totalSeconds % 3600) / 60)
									.toString()
									.padStart(2, "0");
								value = `${h}:${m}`;
							} else {
								// Große Zahl = Echter Unix-Timestamp (z.B. Systemzeit)
								value = new Date(totalSeconds * 1000).toLocaleString("de-DE");
							}
							targetType = "string";
							targetUnit = undefined;
						}
					}

					const folderId = definition.folder;
					const stateId = `${folderId}.${key}`;

					if (!this.createdStates.has(stateId)) {
						await this.setObjectNotExistsAsync(folderId, {
							type: "channel",
							common: { name: folderId.split(".").pop() || folderId },
							native: {},
						});

						await this.setObjectNotExistsAsync(stateId, {
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
							await this.subscribeStatesAsync(stateId);
						}
						this.createdStates.add(stateId);
					}

					await this.setStateChangedAsync(stateId, value, true);
				}
			}

			await calculateTotalThermalEnergy(this);
			await calculateTotalEnergy(this);
			await updateErrorHistory(this, rawValues);
			await updateOutageHistory(this, rawValues);
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
			// --- VIRTUELLES MAKRO: ZIP ENTLÜFTUNG ---
			if (mappingKey === "Activate_Zip") {
				const zipOutState = await this.getStateAsync("Informationen.Ausgaenge.ZIPout");
				const isCurrentlyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;

				const targetVal = isCurrentlyRunning ? 0 : 1;
				const actionText = targetVal === 1 ? "Aktiviere" : "Deaktiviere";

				this.log.info(`Makro gestartet: ${actionText} ZIP Entlüftung basierend auf ZIPout...`);

				await this.writePumpAsync("runDeaerate", targetVal);
				await new Promise(resolve => setTimeout(resolve, 1000));
				await this.writePumpAsync("hotWaterCircPumpDeaerate", targetVal);

				this.log.info(`Makro erfolgreich: ZIP Entlüftungsprogramm wurde auf ${targetVal} gesetzt.`);
				await this.setStateAsync(id, { val: targetVal, ack: true });
				await this.updateData();

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

			// --- DATETIME SCHREIBEN (Text zu Uhrzeit-Sekunden oder Unix-Timestamp) ---
			if (definition.role === "value.datetime") {
				const valStr = String(state.val).trim();

				const timeMatch = valStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
				const dateMatch = valStr.match(
					/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/,
				);

				if (timeMatch) {
					// Uhrzeit in Sekunden seit Mitternacht umwandeln (z.B. für Timer)
					const hour = parseInt(timeMatch[1], 10);
					const minute = parseInt(timeMatch[2], 10);
					const second = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
					valueToWrite = hour * 3600 + minute * 60 + second;
				} else if (dateMatch) {
					// Vollständiges Datum in Unix-Timestamp konvertieren
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

			// Evaluierung ob Raw-Write anhand der Definition
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

			await this.setStateAsync(id, state.val, true);
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

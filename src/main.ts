/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from "@iobroker/adapter-core";
import * as luxtronik from "luxtronik2";
import * as net from "net";
import { STATE_MAPPING } from "./stateMapping";
import { initializeVirtualStates, updateErrorHistory } from "./virtualStates";

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

	/**
	 * Wird aufgerufen, sobald der Adapter mit den ioBroker-Datenbanken verbunden ist.
	 */
	private async onReady(): Promise<void> {
		const ip = this.config.host;
		const port = this.config.port || 8889;

		this.log.info(`Verbinde mit Wärmepumpe auf ${ip}:${port}...`);
		this.pump = new luxtronik.createConnection(ip, port);

		// Alle virtuellen Datenpunkte aus dem Mapping vorab generieren
		await initializeVirtualStates(this);

		// Erste Abfrage sofort starten (Da onReady "async" ist, können wir hier direkt awaiten!)
		await this.updateData();

		await initializeVirtualStates(this);

		// =================================================================
		// NEU: Einmaligen kompletten Log-Dump aller Indizes anstoßen
		// =================================================================
		void this.dumpAllRawToLog();

		// Hole das Intervall aus der Konfiguration (Standard: 30 Sekunden)
		let intervalSeconds = this.config.interval || 30;

		// Sicherheitssperre
		if (intervalSeconds < 10) {
			intervalSeconds = 10;
			this.log.warn("Eingestelltes Intervall war zu kurz. Wurde zum Schutz auf 10 Sekunden korrigiert.");
		}

		this.log.info(`Starte Polling-Intervall. Lese Daten alle ${intervalSeconds} Sekunden aus.`);

		this.pollingInterval = setInterval(() => {
			// Mit dem Wörtchen "void" signalisieren wir TypeScript explizit:
			// "Ja, wir wissen, dass hier ein Promise kommt, aber wir ignorieren es hier absichtlich!"
			void this.updateData();
		}, intervalSeconds * 1000);
	}

	/**
	 * Führt einen einmaligen, vollständigen Dump aller rohen Indizes und Werte
	 * aus 3003 und 3004 in das ioBroker-Log aus.
	 */
	private async dumpAllRawToLog(): Promise<void> {
		try {
			this.log.info("=======================================================");
			this.log.info("START COMPACT RAW DUMP: LISTE 3003 (PARAMETER)");
			this.log.info("=======================================================");

			const params = await this.readAllRaw(3003);
			for (let i = 0; i < params.length; i++) {
				// Gibt JEDEN Index aus, ordentlich formatiert
				this.log.info(`[RAW 3003] Index ${i.toString().padStart(3, " ")} = ${params[i]}`);
			}
			this.log.info(`--- ENDE LISTE 3003 (Insgesamt ${params.length} Indizes geloggt) ---`);

			this.log.info("=======================================================");
			this.log.info("START COMPACT RAW DUMP: LISTE 3004 (MESSWERTE)");
			this.log.info("=======================================================");

			const values = await this.readAllRaw(3004);
			for (let i = 0; i < values.length; i++) {
				this.log.info(`[RAW 3004] Index ${i.toString().padStart(3, " ")} = ${values[i]}`);
			}
			this.log.info(`--- ENDE LISTE 3004 (Insgesamt ${values.length} Indizes geloggt) ---`);
			this.log.info("=======================================================");
		} catch (err: any) {
			this.log.error(`Fehler beim Ausführen des Raw-Dumps: ${err.message}`);
		}
	}
	/**
	 * Liest die komplette Liste (alle Parameter oder alle Messwerte) per TCP aus.
	 *
	 * @param command 3003 (Parameter) oder 3004 (Messwerte)
	 */
	private readAllRaw(command: number): Promise<number[]> {
		return new Promise((resolve, reject) => {
			const client = new net.Socket();
			const host = this.config.host;
			const port = 8888; // Raw-Port ist standardmäßig immer 8888

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

	/**
	 * Rechnet eine Sekundenzahl in das lesbare Format hh:mm:ss um.
	 *
	 * @param totalSeconds Die Sekunden als reine Zahl
	 */
	private formatSecondsToHMS(totalSeconds: number): string {
		if (totalSeconds < 0 || isNaN(totalSeconds)) {
			return "00:00:00";
		}

		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		const hh = hours.toString().padStart(2, "0");
		const mm = minutes.toString().padStart(2, "0");
		const ss = seconds.toString().padStart(2, "0");

		return `${hh}:${mm}:${ss}`;
	}

	/**
	 * Holt alle Daten von der Wärmepumpe ab und verteilt sie im ioBroker.
	 * Konvertiert Sekunden automatisch in das lesbare hh:mm:ss Format.
	 */
	private async updateData(): Promise<void> {
		if (!this.pump) {
			this.log.error("Abfrage abgebrochen: Keine aktive Verbindung zur Wärmepumpe vorhanden.");
			return;
		}

		try {
			// 1. Beide Raw-Listen parallel im Hintergrund via TCP anfordern
			const rawParams = await this.readAllRaw(3003).catch(err => {
				this.log.debug(`Raw-Parameter (3003) nicht verfügbar: ${err.message}`);
				return [] as number[];
			});
			const rawValues = await this.readAllRaw(3004).catch(err => {
				this.log.debug(`Raw-Messwerte (3004) nicht verfügbar: ${err.message}`);
				return [] as number[];
			});

			// 2. Standard-Abfrage über die Coolchip-Bibliothek ausführen
			this.pump.read(async (err: Error | null, coolchipData: any) => {
				if (err) {
					if (err.message && err.message.toLowerCase().includes("busy")) {
						this.log.warn("Wärmepumpe ist ausgelastet (busy). Überspringe diesen Abfrage-Zyklus.");
						return;
					}
					this.log.error(`Verbindungsfehler beim Einlesen der Daten: ${err.message}`);
					return;
				}

				// Schleife über das gesamte Mapping-Wörterbuch
				for (const [key, definition] of Object.entries(STATE_MAPPING)) {
					if (definition.isVirtual) {
						continue;
					}

					// Synchronisations-Check aus der Adapter-Konfiguration
					const configWithDynamicKeys = this.config as Record<string, any>;
					if (configWithDynamicKeys[`sync_${key}`] === false) {
						continue;
					}

					const luxId = definition.luxWriteId || key;
					const isRawNumber = /^\d+$/.test(luxId);
					let value: any = undefined;

					// --- ENTSCHEIDUNG: RAW-WERT ODER COOLCHIP-TEXT-MAPPING ---
					if (isRawNumber) {
						const index = parseInt(luxId, 10);
						if (definition.folder.startsWith("Einstellungen")) {
							if (rawParams && index < rawParams.length) {
								value = rawParams[index];
							}
						} else if (definition.folder.startsWith("Informationen")) {
							if (rawValues && index < rawValues.length) {
								value = rawValues[index];
							}
						}

						// Rohen Wert per Faktor anpassen (z.B. 200 / 10 = 20 °C)
						if (value !== undefined && typeof value === "number" && definition.factor) {
							value = value / definition.factor;
						}
					} else {
						if (coolchipData.values && coolchipData.values[luxId] !== undefined) {
							value = coolchipData.values[luxId];
						} else if (coolchipData.parameters && coolchipData.parameters[luxId] !== undefined) {
							value = coolchipData.parameters[luxId];
						} else if (coolchipData.additional && coolchipData.additional[luxId] !== undefined) {
							value = coolchipData.additional[luxId];
						}
					}

					if (value !== undefined) {
						// Standard-Typenkorrekturen für ioBroker vornehmen
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
						}

						// --- DYNAMISCHE ZEITUMWANDLUNG FÜR SEKUNDEN & JSON-SCHUTZ ---
						// Typ-Weiche für ioBroker: Falls im Mapping "json" steht, machen wir für ioBroker ein "string" daraus
						let targetType: ioBroker.CommonType = definition.type === "json" ? "string" : definition.type;
						let targetRole = definition.role;
						let targetUnit = definition.unit;

						if (definition.unit === "s") {
							const totalSeconds = typeof value === "number" ? value : parseInt(value, 10);
							if (!isNaN(totalSeconds)) {
								value = this.formatSecondsToHMS(totalSeconds);
								targetType = "string"; // Typ zwingend auf string ändern
								targetRole = "text"; // Passende Rolle für Text-Uhrzeit
								targetUnit = undefined; // Einheit "s" entfernen, da kein Zahlenwert mehr
							}
						}
						const folderId = definition.folder;
						const stateId = `${folderId}.${key}`;

						// Dynamische Objekterstellung beim ersten Durchlauf
						if (!this.createdStates.has(stateId)) {
							// Übergeordneten Channel/Ordner anlegen
							await this.setObjectNotExistsAsync(folderId, {
								type: "channel",
								common: { name: folderId.split(".").pop() || folderId },
								native: {},
							});

							// Datenpunkt selbst anlegen (jetzt mit dynamischen Typvariablen)
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

						// Wert nur bei echter Änderung in DB schreiben (schont Systemressourcen)
						await this.setStateChangedAsync(stateId, value, true);
					}
				}

				// Virtuelle / berechnete Datenpunkte aktualisieren
				//await calculateTotalHours(this);

				// WICHTIG: Hier übergeben wir jetzt das rawValues Array!
				await updateErrorHistory(this, rawValues);
			});
		} catch (catchErr) {
			this.log.error(`Fehler im updateData-Ablauf: ${(catchErr as Error).message}`);
		}
	}

	/**
	 * Wird aufgerufen, wenn der Adapter gestoppt oder neugestartet wird.
	 *
	 * @param callback Callback-Funktion, die aufgerufen werden muss, wenn das Beenden abgeschlossen ist.
	 */
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
		} catch (err) {
			this.log.error(`Fehler beim Beenden des Adapters: ${(err as Error).message}`);
			callback();
		}
	}

	/**
	 * Verarbeitet vom Benutzer im ioBroker geänderte Werte und sendet sie an die Wärmepumpe.
	 *
	 * @param id Die ID des geänderten State
	 * @param state Der neue State-Wert
	 */
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

		// --- VIRTUELLES MAKRO: ZIP ENTLÜFTUNG ---
		if (mappingKey === "Activate_Zip") {
			const zipOutState = await this.getStateAsync("Informationen.Ausgaenge.ZIPout");
			const isCurrentlyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;

			const targetVal = isCurrentlyRunning ? 0 : 1;
			const actionText = targetVal === 1 ? "Aktiviere" : "Deaktiviere";

			this.log.info(`Makro gestartet: ${actionText} ZIP Entlüftung basierend auf ZIPout...`);

			this.pump.write("runDeaerate", targetVal, async (err1: any) => {
				if (err1) {
					this.log.error(`Makro Fehler bei Schritt 1 (runDeaerate): ${err1.message}`);
					return;
				}

				await new Promise(resolve => setTimeout(resolve, 1000));
				this.pump.write("hotWaterCircPumpDeaerate", targetVal, async (err2: any) => {
					if (err2) {
						this.log.error(`Makro Fehler bei Schritt 2 (hotWaterCircPumpDeaerate): ${err2.message}`);
						return;
					}

					this.log.info(`Makro erfolgreich: ZIP Entlüftungsprogramm wurde auf ${targetVal} gesetzt.`);
					await this.setState(id, { val: targetVal, ack: true });

					// FIX: Hier das "await" ergänzen, damit das Promise ordnungsgemäß verarbeitet wird
					await this.updateData();
				});
			});
			return;
		}

		// Schreibschutz- und Validierungsprüfung
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

		let valueToWrite = state.val as number;
		if (definition.factor && typeof state.val === "number") {
			valueToWrite = state.val * definition.factor;
		}

		const luxWriteId = definition.luxWriteId;
		const isRawNumber = /^\d+$/.test(luxWriteId);

		// Spezialschutz für rohe Registertemperaturen (falls im Mapping kein Faktor definiert ist)
		if (isRawNumber && definition.unit === "°C" && !definition.factor && typeof state.val === "number") {
			this.log.info(`Raw-Temperatur erkannt. Multipliziere Wert ${state.val} mit Faktor 10 für Luxtronik.`);
			valueToWrite = state.val * 10;
		}

		// Synchroner, linter-konformer Callback für den Schreibvorgang
		const handleWriteResult = (err: any, _result: any): void => {
			if (err) {
				this.log.error(`Fehler beim Schreiben an Luxtronik via [${luxWriteId}]: ${err.message}`);
				return;
			}

			this.log.info(`Wert ${state.val} erfolgreich via [${luxWriteId}] an Wärmepumpe übertragen.`);

			this.setState(id, state.val, true)
				.then(() => new Promise(resolve => setTimeout(resolve, 500)))
				.then(() => this.updateData())
				.catch((setStateErr: any) => {
					this.log.error(`Fehler beim Bestätigen des Status im ioBroker: ${setStateErr.message}`);
				});
		};

		// Datentransfer-Weiche abfeuern
		if (isRawNumber) {
			const paramId = parseInt(luxWriteId, 10);
			this.log.info(`Sende RAW-NUMBER an Luxtronik: ID ${paramId} = ${valueToWrite}`);
			this.pump.writeRaw(paramId, valueToWrite, handleWriteResult);
		} else {
			this.log.info(`Sende STANDARD-STRING an Luxtronik: Name "${luxWriteId}" = ${valueToWrite}`);
			this.pump.write(luxWriteId, valueToWrite, handleWriteResult);
		}
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Lwd50a(options);
} else {
	(() => new Lwd50a())();
}

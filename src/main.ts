/*
 * Created with @iobroker/create-adapter v3.1.5
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import * as luxtronik from "luxtronik2";
import * as net from "net";
// Importiere dein neues Mapping-Objekt
import { STATE_MAPPING } from "./stateMapping";

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
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here

		const ip = this.config.host;
		const port = this.config.port || 8889;

		this.log.info(`Verbinde mit Wärmepumpe auf ${ip}:${port}...`);

		// Speichere die Verbindung in der Klassenvariable
		this.pump = new luxtronik.createConnection(ip, port);

		// Erste Abfrage sofort starten
		this.updateData();

		// --- VIRTUELLE DATENPUNKTE ANLEGEN ---
		const zipDef = STATE_MAPPING.Activate_Zip;
		if (zipDef) {
			await this.setObjectNotExistsAsync(`${zipDef.folder}.Activate_Zip`, {
				type: "state",
				common: {
					name: zipDef.name,
					type: zipDef.type,
					role: zipDef.role,
					read: true,
					write: true,
					def: 0, // Standardwert auf AUS
					states: zipDef.states,
				},
				native: {},
			});
			// Optional: Den Status direkt beim Start initial auf 0 (Aus) setzen,
			// damit er nicht unbestätigt (null) bleibt.
			await this.setState(`${zipDef.folder}.Activate_Zip`, { val: 0, ack: true });
			await this.subscribeStatesAsync(`${zipDef.folder}.Activate_Zip`);
		}

		const paramId = 700;
		this.log.info(`Sende RAW an Luxtronik via Bibliothek: ID ${paramId} = ${15}`);

		// WICHTIG: Da writeRaw in den offiziellen TypeScript-Typen (types.d.ts) der
		// Bibliothek wahrscheinlich nicht dokumentiert ist, tricksen wir TypeScript
		// mit "as any" kurz aus, damit es keine rote Fehlerlinie wirft!
		this.pump.writeRaw(paramId, 15, (err: any, data: any) => {
			if (err) {
				this.log.error(`Raw-Write fehlgeschlagen für ID ${paramId}: ${err.message}`);
				return;
			}

			this.log.info(`Raw-Write erfolgreich auf ${15} gesetzt! Pumpe antwortet: ${JSON.stringify(data)}`);
			try {
				// 3. Werte neu abfragen
				this.updateData();
			} catch (setStateErr: any) {
				this.log.error(`Fehler beim Bestätigen des Status im ioBroker: ${setStateErr.message}`);
			}
		});

		// Hole das Intervall aus der Konfiguration (Standard: 30 Sekunden)
		// WICHTIG: setInterval benötigt Millisekunden, daher * 1000
		let intervalSeconds = this.config.interval || 30;

		// Sicherheitssperre: Niemals öfter als alle 10 Sekunden abfragen,
		// um die Steuerung der Luxtronik nicht zum Absturz zu bringen!
		if (intervalSeconds < 10) {
			intervalSeconds = 10;
			this.log.warn("Eingestelltes Intervall war zu kurz. Wurde zum Schutz auf 10 Sekunden korrigiert.");
		}

		this.log.info(`Starte Polling-Intervall. Lese Daten alle ${intervalSeconds} Sekunden aus.`);

		this.pollingInterval = setInterval(() => {
			this.log.debug("Polling ausgelöst: Hole frische Daten von der Wärmepumpe...");

			// Hier rufst du einfach deine bestehende Auslese-Funktion auf
			this.updateData();
		}, intervalSeconds * 1000);

		// --- TEST: ALLE WERTE MIT BOUNIS TITELN INS LOG AUSGEBEN ---
		// setTimeout(async () => {
		// 	try {
		// 		// ==========================================
		// 		// 1. UNSER WÖRTERBUCH (Korrigierte Zuordnung)
		// 		// ==========================================

		// 		// 3004 = MESSWERTE (Calculated - Read Only)
		// 		const TITLES_3004: Record<number, string> = {
		// 			10: "Temperatur Vorlauf",
		// 			11: "Temperatur Rücklauf",
		// 			12: "Temperatur Rücklauf Soll",
		// 			13: "Temperatur Heissgas",
		// 			14: "Temperatur Aussen",
		// 			15: "Temperatur Brauchwasser Ist",
		// 			16: "Temperatur Brauchwasser Soll",
		// 			17: "Temperatur Wärmequelle Ein",
		// 			18: "Temperatur Wärmequelle Aus",
		// 		};

		// 		// 3003 = PARAMETER (Settings - Lese- und Schreibbar)
		// 		const TITLES_3003: Record<number, string> = {
		// 			1: "Heizkurve Abstand",
		// 			2: "Heizkurve Endpunkt",
		// 			3: "Heizkurve Parallelverschiebung",
		// 			4: "Heizkurve Nachtabsenkung",
		// 			207: "Dein gesuchter Wert (207)",
		// 			699: "Pumpenoptimierung",
		// 		};

		// 		// ==========================================
		// 		// 2. DAS AUSLESEN UND ÜBERSETZEN
		// 		// ==========================================

		// 		// Ändere dies auf 3003 (Parameter) oder 3004 (Messwerte)
		// 		const COMMAND = 3003;
		// 		const DICTIONARY = COMMAND === 3003 ? TITLES_3003 : TITLES_3004;

		// 		this.log.info(`Lade komplette Liste für Befehl ${COMMAND}...`);
		// 		const allValues = await this.readAllRaw(COMMAND);

		// 		this.log.info(`✅ ERFOLG! Liste ${COMMAND} hat ${allValues.length} Werte geliefert. Starte Ausgabe...`);

		// 		let foundValues = 0;
		// 		for (let i = 0; i < allValues.length; i++) {
		// 			const val = allValues[i];

		// 			if (val !== 0 || DICTIONARY[i] !== undefined) {
		// 				const title = DICTIONARY[i] ? DICTIONARY[i] : "Unbekannt";
		// 				const marker = DICTIONARY[i] ? "⭐" : "  ";

		// 				this.log.info(
		// 					`${marker} [Index ${i.toString().padStart(3, " ")}] ${title.padEnd(35, " ")} = ${val}`,
		// 				);
		// 				foundValues++;
		// 			}
		// 		}
		// 		this.log.info(`Smart Log beendet: ${foundValues} relevante Werte gefunden.`);
		// 	} catch (error: any) {
		// 		this.log.error(`Listen-Abfrage fehlgeschlagen: ${error.message}`);
		// 	}
		// }, 8000);
	}

	/**
	 * Liest die komplette Liste (alle Parameter oder alle Messwerte) per TCP aus.
	 *
	 * @param command 3003 (Parameter) oder 3004 (Messwerte)
	 * @returns Ein Promise, das ein Array mit allen Werten zurückgibt
	 */
	private readAllRaw(command: number): Promise<number[]> {
		return new Promise((resolve, reject) => {
			const client = new net.Socket();
			const host = this.config.host;
			const port = this.config.port || 8888;

			let responseData = Buffer.alloc(0);

			client.connect(port, host, () => {
				this.log.info(`[RAW READ ALL] Fordere komplette Liste ${command} an...`);

				const buffer = Buffer.alloc(8);
				buffer.writeInt32BE(command, 0);
				buffer.writeInt32BE(0, 4);
				client.write(buffer);
			});

			client.on("data", (chunk: Buffer) => {
				responseData = Buffer.concat([responseData, chunk]);

				// --- DER PROTOKOLL-FIX ---
				// 3004 (Messwerte) hat 12 Bytes Header. 3003 (Parameter) hat nur 8 Bytes Header!
				const is3004 = command === 3004;
				const headerSize = is3004 ? 12 : 8;
				const lengthOffset = is3004 ? 8 : 4;

				// Warten, bis wir zumindest den kompletten Header haben
				if (responseData.length >= headerSize) {
					const responseCommand = responseData.readInt32BE(0);

					if (responseCommand === command) {
						// Länge am korrekten Byte ablesen
						const totalItems = responseData.readInt32BE(lengthOffset);
						const totalRequiredLength = headerSize + totalItems * 4;

						// Haben wir das komplette Datenpaket empfangen?
						if (responseData.length >= totalRequiredLength) {
							const allValues: number[] = [];

							// Schleife über alle Einträge
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
	 * Holt die Daten von der Wärmepumpe und schreibt sie in ioBroker
	 */
	private updateData(): void {
		if (!this.pump) {
			this.log.error("Abfrage abgebrochen: Keine aktive Verbindung zur Wärmepumpe vorhanden.");
			return;
		}

		this.pump.read(async (err: Error | null, data: any) => {
			if (err) {
				// NEU: Prüfen, ob die Wärmepumpe beschäftigt ("busy") ist
				if (err.message && err.message.toLowerCase().includes("busy")) {
					this.log.warn("Wärmepumpe ist ausgelastet (busy). Überspringe diesen Abfrage-Zyklus.");
					return; // Das nächste normale Intervall holt die Daten wieder!
				}

				// Normaler Verbindungsfehler
				this.log.error(`Verbindungsfehler beim Einlesen der Daten: ${err.message}`);
				return;
			}
			//this.log.info("Daten von der Wärmepumpe erfolgreich empfangen.");

			try {
				// Wir kombinieren values und parameters in ein einziges Objekt,
				// damit wir beide Bereiche in einer einzigen Schleife durchlaufen können.
				const allIncomingData = {
					...data.values,
					...data.parameters,
				};

				for (const [key, value] of Object.entries(allIncomingData)) {
					const definition = STATE_MAPPING[key];

					if (definition) {
						// Wir sagen TypeScript, dass wir für diesen kurzen Check die Config
						// als Objekt betrachten, das mit beliebigen Text-Schlüsseln (string) abgefragt werden darf.
						const configWithDynamicKeys = this.config as Record<string, any>;
						const configKey = `sync_${key}`;

						if (configWithDynamicKeys[configKey] === false) {
							this.log.debug(`Datenpunkt ${key} übersprungen, da in der Konfiguration deaktiviert.`);
							continue;
						}

						const folderId = definition.folder;
						const stateId = `${folderId}.${key}`;

						// --- WERT-ANPASSUNG (z.B. Druckwerte von Zentibar in bar umrechnen) ---
						let finalValue = value;

						// 1. Behandlung für den Typ "number" (Zahlen)
						if (definition.type === "number") {
							if (typeof value === "string") {
								const textValue = value.toLowerCase();
								if (textValue === "ein") {
									finalValue = 1;
								} else if (textValue === "aus") {
									finalValue = 0;
								} else {
									finalValue = parseFloat(value);
								}
							} else {
								finalValue = value;
							}
						} else if (definition.type === "boolean") {
							if (typeof value === "string") {
								const textValue = value.toLowerCase();
								if (textValue === "ein" || textValue === "true" || textValue === "1") {
									finalValue = true;
								} else if (textValue === "aus" || textValue === "false" || textValue === "0") {
									finalValue = false;
								} else {
									// Fallback, falls die Pumpe Unerwartetes sendet
									finalValue = false;
								}
							} else {
								// Wenn der Wert von der Pumpe schon ein echter Boolean oder eine Zahl ist
								finalValue = value === true || value === 1;
							}
						}

						// --- UNIVERSELLE FAKTOR-ANPASSUNG FÜR NUMMERN ---
						// Wenn ein Faktor im Mapping definiert ist, wird der Wert hierdurch geteilt
						if (typeof finalValue === "number" && !isNaN(finalValue) && definition.factor) {
							finalValue = finalValue / definition.factor;
						}
						// -------------------------------------------------

						// Prüfen, ob wir diesen Datenpunkt in dieser Sitzung schon angelegt haben
						if (!this.createdStates.has(stateId)) {
							// 1. Zuerst den Ordner (Channel) anlegen
							await this.setObjectNotExists(folderId, {
								type: "channel",
								common: {
									name: folderId.charAt(0).toUpperCase() + folderId.slice(1),
								},
								native: {},
							});

							// 2. Dann den eigentlichen Datenpunkt anlegen
							await this.setObjectNotExists(stateId, {
								type: "state",
								common: {
									name: definition.name,
									type: definition.type,
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

							// 3. Wenn das Objekt beschreibbar ist, abonnieren
							if (definition.write) {
								await this.subscribeStatesAsync(stateId);
							}

							// 4. Im Gedächtnis abspeichern, damit es beim nächsten Intervall übersprungen wird!
							this.createdStates.add(stateId);
						}

						// 5. Zuletzt den Wert in den Datenpunkt schreiben (Das passiert IMMER!)
						await this.setState(stateId, finalValue as any, true);
					}
				}
			} catch (catchErr) {
				this.log.error(
					`Fehler beim Schreiben der Objekte in die ioBroker-Datenbank: ${(catchErr as Error).message}`,
				);
			}
		});
	}

	/**
	 * Wird aufgerufen, wenn der Adapter beendet wird (z.B. Neustart oder Update)
	 *
	 * @param callback - Callback-Funktion, die aufgerufen wird, wenn das Beenden abgeschlossen ist
	 */
	private onUnload(callback: () => void): void {
		try {
			// 1. Intervall stoppen! Ganz wichtig!
			if (this.pollingInterval) {
				clearInterval(this.pollingInterval);
				this.pollingInterval = undefined;
				this.log.info("Polling-Intervall erfolgreich gestoppt.");
			}

			// 2. Verbindung zur Pumpe sicher trennen (falls die Bibliothek das unterstützt)
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

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  */
	// private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 *
	 * @param id - State ID
	 * @param state - State object
	 */
	private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
		if (!state) {
			this.log.info(`State ${id} wurde gelöscht.`);
			return;
		}

		if (state.ack) {
			return;
		}

		this.log.info(`Nutzerbefehl empfangen für ${id}: ${state.val}`);

		const mappingKey = id.split(".").pop();
		// 1. Sicherheits-Check: Abbrechen, wenn mappingKey undefined oder leer ist
		if (!mappingKey) {
			this.log.warn(`Konnte keinen gültigen State-Schlüssel aus der ID extrahieren: ${id}`);
			return; // Bricht die Funktion hier ab, damit es keine Abstürze gibt
		}

		this.log.info(mappingKey);
		const definition = STATE_MAPPING[mappingKey];
		this.log.info(`Wert geändert für ${mappingKey}: ${JSON.stringify(definition)}`);

		// 1. Schritt: Existiert die Definition überhaupt im Mapping?
		if (!definition) {
			this.log.warn(`Kein Mapping für ${mappingKey} gefunden.`);
			return;
		}

		// 2. Schritt: Virtuelle Makros abfangen (bevor luxWriteId geprüft wird!)
		if (mappingKey === "Activate_Zip") {
			const zipOutState = await this.getStateAsync("Informationen.Ausgaenge.ZIPout");
			const isCurrentlyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;

			const targetVal = isCurrentlyRunning ? 0 : 1;
			const actionText = targetVal === 1 ? "Aktiviere" : "Deaktiviere";

			this.log.info(
				`Makro gestartet: ${actionText} ZIP Entlüftung basierend auf ZIPout (Ziel-Status: ${targetVal})...`,
			);

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
					this.updateData();
				});
			});

			// Ganz wichtig: return hier stehen lassen, damit der normale Schreibcode übersprungen wird!
			return;
		}

		// 3. Schritt: Strenge Prüfung für alle NORMALEN Schreib-Datenpunkte
		if (!definition.luxWriteId || definition.write !== true) {
			this.log.warn(`Kein Schreib-Mapping für ${mappingKey} gefunden.`);
			return;
		}

		// Zusätzlicher Schutz: Prüfen, ob der eingegebene Wert die Limits sprengt
		if (typeof state.val === "number") {
			if (definition.min !== undefined && state.val < definition.min) {
				this.log.warn(
					`Eingabewert ${state.val} unterschreitet Minimum von ${definition.min} für ${mappingKey}. Abgebrochen.`,
				);
				return;
			}
			if (definition.max !== undefined && state.val > definition.max) {
				this.log.warn(
					`Eingabewert ${state.val} überschreitet Maximum von ${definition.max} für ${mappingKey}. Abgebrochen.`,
				);
				return;
			}
		}

		if (!this.pump) {
			this.log.error("Schreiben abgebrochen: Keine aktive Verbindung zur Wärmepumpe vorhanden.");
			return;
		}

		// Callback wird "async", damit wir darin await nutzen können
		// 1. Umrechnung: Falls ein Faktor definiert ist, den ioBroker-Wert wieder für die Pumpe hochrechnen!
		let valueToWrite = state.val as number;
		if (definition.factor && typeof state.val === "number") {
			valueToWrite = state.val * definition.factor;
		}

		this.log.info(`Sende an Luxtronik: ${definition.luxWriteId} = ${valueToWrite}`);

		// Callback als async deklarieren, damit wir innen "await" nutzen können
		this.pump.write(definition.luxWriteId, valueToWrite, async (err: any, _result: any) => {
			if (err) {
				this.log.error(`Fehler beim Schreiben an Luxtronik (${definition.luxWriteId}): ${err.message}`);
				return;
			}

			this.log.info(`Wert ${state.val} erfolgreich an Wärmepumpe übertragen.`);

			try {
				// 2. Den Wert im ioBroker offiziell bestätigen (ack: true)
				// Moderne Schreibweise: setState (ohne Async am Ende) gibt automatisch ein Promise zurück
				await this.setState(id, state.val, true);

				// 3. Der Luxtronik-Steuerung eine kleine Pause geben, um den internen Speicher zu schreiben
				await new Promise(resolve => setTimeout(resolve, 500));

				// 4. Frische Daten von der Anlage holen, damit alles 100% synchron ist
				this.updateData();
			} catch (setStateErr: any) {
				this.log.error(`Fehler beim Bestätigen des Status im ioBroker: ${setStateErr.message}`);
			}
		});
	}
	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  */
	//
	// private onMessage(obj: ioBroker.Message): void {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");
	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }
}
if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Lwd50a(options);
} else {
	// otherwise start the instance directly
	(() => new Lwd50a())();
}

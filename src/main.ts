/*
 * Created with @iobroker/create-adapter v3.1.5
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import * as luxtronik from "luxtronik2";
// Importiere dein neues Mapping-Objekt
import { STATE_MAPPING } from "./stateMapping";

class Lwd50a extends utils.Adapter {
	private pollingInterval?: NodeJS.Timeout;
	private pump: any;
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
	private onReady(): void {
		// Initialize your adapter here

		const ip = "192.168.178.81";
		const port = 8889;

		this.log.info(`Verbinde mit Wärmepumpe auf ${ip}:${port}...`);

		// Speichere die Verbindung in der Klassenvariable
		this.pump = new luxtronik.createConnection(ip, port);

		// Erste Abfrage sofort starten
		this.updateData();

		// Abfrage alle 30 Sekunden (30.000 Millisekunden) wiederholen
		this.pollingInterval = setInterval(() => {
			this.updateData();
		}, 30000);

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		// this.log.debug("config option1: ${this.config.option1}");
		// this.log.debug("config option2: ${this.config.option2}");

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables

		IMPORTANT: State roles should be chosen carefully based on the state's purpose.
		           Please refer to the state roles documentation for guidance:
		           https://www.iobroker.net/#en/documentation/dev/stateroles.md
		*/
		// await this.setObjectNotExistsAsync("testVariable", {
		// 	type: "state",
		// 	common: {
		// 		name: "testVariable",
		// 		type: "boolean",
		// 		role: "indicator",
		// 		read: true,
		// 		write: true,
		// 	},
		// 	native: {},
		// });

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		// this.subscribeStates("testVariable");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		// await this.setState("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		// await this.setState("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setState("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		// const pwdResult = await this.checkPasswordAsync("admin", "iobroker");
		// this.log.info(`check user admin pw iobroker: ${JSON.stringify(pwdResult)}`);

		// const groupResult = await this.checkGroupAsync("admin", "admin");
		// this.log.info(`check group user admin group admin: ${JSON.stringify(groupResult)}`);
	}

	/**
	 * Holt die Daten von der Wärmepumpe und schreibt sie in ioBroker
	 */
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
					this.log.warn("Wärmepumpe ist ausgelastet (busy). Erneuter Versuch in 15 Sekunden...");

					setTimeout(() => {
						this.updateData();
					}, 15000);

					return; // Wichtig: Methode hier abbrechen, da keine Daten da sind
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
						const folderId = definition.folder;
						const stateId = `${folderId}.${key}`;

						// --- WERT-ANPASSUNG (z.B. Druckwerte von Zentibar in bar umrechnen) ---
						let finalValue = value;
						if (definition.unit === "bar" && typeof finalValue === "number") {
							finalValue = finalValue / 100;
						}

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

						// 4. Zuletzt den Wert in den Datenpunkt schreiben
						await this.setState(stateId, value as any, true);
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
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 *
	 * @param callback - Callback function
	 */
	private onUnload(callback: () => void): void {
		try {
			// Timer stoppen, um Memory Leaks zu vermeiden
			if (this.pollingInterval) {
				clearInterval(this.pollingInterval);
			}

			callback();
		} catch (error) {
			this.log.error(`Error during unloading: ${(error as Error).message}`);
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
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (!state) {
			this.log.info(`State ${id} wurde gelöscht.`);
			return;
		}

		if (state.ack) {
			return;
		}

		this.log.info(`Nutzerbefehl empfangen für ${id}: ${state.val}`);

		const idParts = id.split(".");
		idParts.shift(); // lwd50a entfernen
		idParts.shift(); // Instanz entfernen
		idParts.shift(); // Ordner entfernen
		this.log.info(idParts[0]);
		const mappingKey = idParts[0];
		const definition = STATE_MAPPING[mappingKey];

		if (!definition || !definition.LuxID) {
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

		this.log.info(`Sende an Luxtronik: ${definition.LuxID} = ${state.val}`);
		// Callback wird "async", damit wir darin await nutzen können
		this.pump.write(definition.LuxID, state.val, (err: any, _result: any) => {
			if (err) {
				this.log.error(`Fehler beim Schreiben an Luxtronik (${definition.LuxID}): ${err.message}`);
				return;
			}

			this.log.info(`Wert ${state.val} erfolgreich an Wärmepumpe übertragen.`);
			// Wir nutzen die Standardmethode (ohne await) und hängen ein .catch() an.
			// Das löst alle Linter-Probleme bezüglich "floating promises" sofort auf.
			this.setState(id, state.val, true, setStateErr => {
				if (setStateErr) {
					this.log.error(`Fehler beim Bestätigen des Status im ioBroker: ${setStateErr.message}`);
				}
				// Sofort frische Daten nach dem Bestätigen holen
				this.updateData();
			}).catch(err => {
				this.log.error(`Fehler beim Schreiben des Status: ${err}`);
			});
			// Wir geben der Wärmepumpe 500ms Zeit, den Wert intern zu verarbeiten,
			// und holen dann die frischen, bestätigten Daten ab.
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

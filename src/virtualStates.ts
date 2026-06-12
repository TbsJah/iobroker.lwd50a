import { STATE_MAPPING } from "./stateMapping";

// Moderner, linter-konformer ES6-Import (benötigt die luxtronik2.d.ts im src-Ordner)
import * as luxtronikTypes from "luxtronik2/types";

/**
 * Erstellt alle virtuellen Datenpunkte dynamisch im ioBroker.
 * Übersetzt den Typ "json" automatisch in ein ioBroker-konformes Objekt und erstellt Channels.
 *
 * @param adapter Beispiel: "this" innerhalb der Adapter-Klasse, damit die Methoden setObjectNotExistsAsync und setStateAsync verfügbar sind
 */
export async function initializeVirtualStates(adapter: any): Promise<void> {
	try {
		for (const [key, definition] of Object.entries(STATE_MAPPING)) {
			if (definition.isVirtual) {
				const folderId = definition.folder;
				const fullId = `${folderId}.${key}`;

				// 1. Zuerst den Channel (Ordner) anlegen
				await adapter.setObjectNotExistsAsync(folderId, {
					type: "channel",
					common: { name: folderId.split(".").pop() || folderId },
					native: {},
				});

				// 2. Danach den eigentlichen Datenpunkt (State) anlegen
				const ioBrokerType = definition.type === "json" ? "string" : definition.type;

				await adapter.setObjectNotExistsAsync(fullId, {
					type: "state",
					common: {
						name: definition.name,
						type: ioBrokerType,
						role: definition.role,
						unit: definition.unit,
						read: true,
						write: !!definition.write,
						states: definition.states,
					},
					native: {},
				});

				// 3. Initialwert setzen, falls der Datenpunkt nagelneu ist
				const currentState = await adapter.getStateAsync(fullId);
				if (!currentState) {
					const defaultVal = definition.type === "json" ? "[]" : definition.type === "number" ? 0 : false;
					await adapter.setStateAsync(fullId, { val: defaultVal, ack: true });
				}

				if (definition.write) {
					await adapter.subscribeStatesAsync(fullId);
				}
			}
		}
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Initialisierung der virtuellen Datenpunkte: ${err.message}`);
	}
}

/**
 * Berechnet die Gesamt-Wärmemenge aus Heizung und Warmwasser
 * und schreibt das Ergebnis in den virtuellen Datenpunkt.
 *
 * @param adapter Beispiel: "this" innerhalb der Adapter-Klasse, damit die Methoden setObjectNotExistsAsync und setStateAsync verfügbar sind
 */
export async function calculateTotalThermalEnergy(adapter: any): Promise<void> {
	try {
		const heatingState = await adapter.getStateAsync("Informationen.09_Wärmemenge.thermalenergy_heating");
		const warmwaterState = await adapter.getStateAsync("Informationen.09_Wärmemenge.thermalenergy_warmwater");

		const thermalEnergyHeating = heatingState && typeof heatingState.val === "number" ? heatingState.val : 0;
		const thermalEnergyWarmwater =
			warmwaterState && typeof warmwaterState.val === "number" ? warmwaterState.val : 0;

		const totalThermalEnergy = thermalEnergyHeating + thermalEnergyWarmwater;

		await adapter.setStateChangedAsync("Informationen.09_Wärmemenge.thermalenergy_total", totalThermalEnergy, true);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Berechnung der Gesamt-Wärmemenge: ${err.message}`);
	}
}

/**
 * Berechnet die Gesamt-Energie aus Heizung und Warmwasser
 * und schreibt das Ergebnis in den virtuellen Datenpunkt.
 *
 * @param adapter Beispiel: "this" innerhalb der Adapter-Klasse, damit die Methoden setObjectNotExistsAsync und setStateAsync verfügbar sind
 */
export async function calculateTotalEnergy(adapter: any): Promise<void> {
	try {
		const heatingState = await adapter.getStateAsync("Informationen.09_Wärmemenge.energy_heating");
		const warmwaterState = await adapter.getStateAsync("Informationen.09_Wärmemenge.energy_warmwater");

		const EnergyHeating = heatingState && typeof heatingState.val === "number" ? heatingState.val : 0;
		const EnergyWarmwater = warmwaterState && typeof warmwaterState.val === "number" ? warmwaterState.val : 0;

		const totalEnergy = EnergyHeating + EnergyWarmwater;

		await adapter.setStateChangedAsync("Informationen.09_Wärmemenge.energy_total", totalEnergy, true);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Berechnung der Gesamt-Energie: ${err.message}`);
	}
}

/**
 * Liest die Fehler-Indizes direkt aus der 3004-Liste (Messwerte) aus,
 * übersetzt die Fehlercodes in Klartext und baut ein strukturiertes JSON-Array.
 *
 * @param adapter Die Instanz des aktuellen ioBroker-Adapters
 * @param rawValues Das komplette Array des Befehls 3004
 */
export async function updateErrorHistory(adapter: any, rawValues: number[]): Promise<void> {
	try {
		// Sicherheits-Check: Ist das Raw-Array überhaupt groß genug?
		if (!rawValues || rawValues.length < 105) {
			adapter.log.debug("[Virtual DP] Fehlerhistorie übersprungen: Unvollständiges Raw-Array 3004.");
			return;
		}

		const errorLogList = [];

		// Schleife läuft exakt 5-mal (für Fehler 1 bis Fehler 5)
		for (let i = 0; i < 5; i++) {
			// ZUORDNUNG: 95-99 = Zeitstempel, 100-104 = Fehlercode
			const errorTimestamp = rawValues[95 + i];
			const errorCode = rawValues[100 + i];

			// Nur verarbeiten, wenn ein echter Fehlercode vorliegt (Code ungleich 0)
			if (errorCode !== 0) {
				// Unix-Timestamp in Millisekunden umrechnen und lokales deutsches Format erzeugen
				const dateObject = new Date(errorTimestamp * 1000);
				const readableDate = errorTimestamp > 0 ? dateObject.toLocaleString("de-DE") : "Unbekannt";

				// Fallback-Text generieren, falls der Code gänzlich unbekannt ist
				let fehlerText = `Unbekannter Fehler (${errorCode})`;

				// Stufenweise, crash-sichere Überprüfung des exportierten Bibliotheks-Objekts
				if (luxtronikTypes) {
					const TypesAny = luxtronikTypes;

					if (TypesAny.errorCodes && TypesAny.errorCodes[errorCode]) {
						fehlerText = TypesAny.errorCodes[errorCode];
					} else if (TypesAny.codes && TypesAny.codes[errorCode]) {
						fehlerText = TypesAny.codes[errorCode];
					} else if (TypesAny[errorCode]) {
						fehlerText = TypesAny[errorCode];
					}
				}

				// Strukturiertes Objekt in das Array pushen
				errorLogList.push({
					index: i + 1,
					code: errorCode,
					beschreibung: fehlerText,
					datum: readableDate,
					timestamp: errorTimestamp,
				});
			}
		}

		// Array in einen JSON-String konvertieren und im ioBroker speichern
		const jsonString = JSON.stringify(errorLogList);
		await adapter.setStateChangedAsync("Informationen.06_Fehlerspeicher.Fehlerspeicher", jsonString, true);

		//	adapter.log.debug(`[Virtual DP] RAW-Fehlerhistorie aktualisiert. ${errorLogList.length} Einträge hinterlegt.`);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Generierung der RAW-JSON-Fehlerhistorie: ${err.message}`);
	}
}

/**
 * Liest die Abschalt-Indizes direkt aus der 3004-Liste (Messwerte) aus,
 * übersetzt die Codes in Klartext und baut ein strukturiertes JSON-Array.
 *
 * @param adapter Die Instanz des aktuellen ioBroker-Adapters
 * @param rawValues Das komplette Array des Befehls 3004
 */
export async function updateOutageHistory(adapter: any, rawValues: number[]): Promise<void> {
	try {
		// Sicherheits-Check: Ist das Raw-Array groß genug für Index 115? (Länge muss min. 116 sein)
		if (!rawValues || rawValues.length < 116) {
			adapter.log.debug("[Virtual DP] Abschalthistorie übersprungen: Unvollständiges Raw-Array 3004.");
			return;
		}

		const outageLogList = [];

		// Schleife läuft exakt 5-mal (für Abschaltung 1 bis 5)
		for (let i = 0; i < 5; i++) {
			// ZUORDNUNG LAUT DEINER PRÜFUNG:
			// 106-110 = Abschaltcode, 111-115 = Zeitstempel
			const outageCode = rawValues[106 + i];
			const outageTimestamp = rawValues[111 + i];

			// Nur verarbeiten, wenn ein echter Code vorliegt (ungleich 0)
			if (outageCode !== 0) {
				// Unix-Timestamp in Millisekunden umrechnen und lokales deutsches Format erzeugen
				const dateObject = new Date(outageTimestamp * 1000);
				const readableDate = outageTimestamp > 0 ? dateObject.toLocaleString("de-DE") : "Unbekannt";

				// Fallback-Text generieren
				let abschaltText = `Unbekannter Abschaltgrund (${outageCode})`;

				// Stufenweise, crash-sichere Überprüfung der Bibliotheks-Utils
				if (luxtronikTypes) {
					const utilsAny = luxtronikTypes;

					if (utilsAny.outageCodes && utilsAny.outageCodes[outageCode]) {
						abschaltText = utilsAny.outageCodes[outageCode];
					} else if (utilsAny.outages && utilsAny.outages[outageCode]) {
						abschaltText = utilsAny.outages[outageCode];
					} else if (utilsAny.switchOffCodes && utilsAny.switchOffCodes[outageCode]) {
						abschaltText = utilsAny.switchOffCodes[outageCode];
					}
				}

				outageLogList.push({
					index: i + 1,
					code: outageCode,
					beschreibung: abschaltText,
					datum: readableDate,
					timestamp: outageTimestamp,
				});
			}
		}

		// Array in einen JSON-String konvertieren und im ioBroker speichern
		const jsonString = JSON.stringify(outageLogList);
		await adapter.setStateChangedAsync("Informationen.07_Abschaltungen.Abschaltungen", jsonString, true);

		//adapter.log.debug(`[Virtual DP] RAW-Abschalthistorie aktualisiert. ${outageLogList.length} Einträge hinterlegt.`,);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Generierung der RAW-JSON-Abschalthistorie: ${err.message}`);
	}
}

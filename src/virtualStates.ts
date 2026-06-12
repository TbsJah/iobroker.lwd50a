import { STATE_MAPPING } from "./stateMapping";

// Moderner, linter-konformer ES6-Import (benötigt die luxtronik2.d.ts im src-Ordner)
import * as luxtronikTypes from "luxtronik2/types";

/**
 * Erstellt alle virtuellen Datenpunkte dynamisch im ioBroker.
 * Übersetzt den Typ "json" automatisch in ein ioBroker-konformes Objekt und erstellt Channels.
 *
 * @param adapter Die Instanz des ioBroker-Adapters (this)
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

// ==========================================
// BERECHNUNGEN (DRY-Prinzip)
// ==========================================

/**
 * Universelle Hilfsfunktion, um zwei Werte aus dem ioBroker zu addieren.
 *
 * @param adapter Die Instanz des ioBroker-Adapters (this)
 * @param sourceId1 Die ioBroker-ID des ersten Summanden
 * @param sourceId2 Die ioBroker-ID des zweiten Summanden
 * @param targetId Die ioBroker-ID des Ziel-Datenpunkts, in den das Ergebnis geschrieben wird
 * @param logName Der Anzeigename für das ioBroker-Log im Fehlerfall
 */
async function calculateSum(
	adapter: any,
	sourceId1: string,
	sourceId2: string,
	targetId: string,
	logName: string,
): Promise<void> {
	try {
		const state1 = await adapter.getStateAsync(sourceId1);
		const state2 = await adapter.getStateAsync(sourceId2);

		const val1 = state1 && typeof state1.val === "number" ? state1.val : 0;
		const val2 = state2 && typeof state2.val === "number" ? state2.val : 0;

		await adapter.setStateChangedAsync(targetId, val1 + val2, true);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Berechnung der ${logName}: ${err.message}`);
	}
}

/**
 * Berechnet die Gesamt-Wärmemenge aus Heizung und Warmwasser.
 *
 * @param adapter Die Instanz des ioBroker-Adapters (this)
 */
export async function calculateTotalThermalEnergy(adapter: any): Promise<void> {
	await calculateSum(
		adapter,
		"Informationen.09_Wärmemenge.thermalenergy_heating",
		"Informationen.09_Wärmemenge.thermalenergy_warmwater",
		"Informationen.09_Wärmemenge.thermalenergy_total",
		"Gesamt-Wärmemenge",
	);
}

/**
 * Berechnet die Gesamt-Energie aus Heizung und Warmwasser.
 *
 * @param adapter Die Instanz des ioBroker-Adapters (this)
 */
export async function calculateTotalEnergy(adapter: any): Promise<void> {
	await calculateSum(
		adapter,
		"Informationen.10_Engergie.energy_heating",
		"Informationen.10_Engergie.energy_warmwater",
		"Informationen.10_Engergie.energy_total",
		"Gesamt-Energie",
	);
}

// ==========================================
// HISTORIEN & LOGS (DRY-Prinzip)
// ==========================================

/**
 * Universelle Hilfsfunktion, um Arrays aus Befehl 3004 in ein JSON-Objekt zu übersetzen.
 *
 * @param adapter Die Instanz des ioBroker-Adapters (this)
 * @param rawValues Das Array der rohen Messwerte (Befehl 3004)
 * @param startIdxTime Der Array-Index für den ersten Zeitstempel
 * @param startIdxCode Der Array-Index für den ersten Fehler-/Abschaltcode
 * @param targetId Die ioBroker-ID des Ziel-Datenpunkts (JSON)
 * @param dictKeys Array mit möglichen Objekt-Schlüsseln für das Wörterbuch im Luxtronik-Modul
 * @param fallbackPrefix Präfix für den Text, falls der Code gänzlich unbekannt ist
 */
async function updateHistory(
	adapter: any,
	rawValues: number[],
	startIdxTime: number,
	startIdxCode: number,
	targetId: string,
	dictKeys: string[],
	fallbackPrefix: string,
): Promise<void> {
	try {
		// Prüfen, ob das Array groß genug ist (höchster benötigter Index + 5 Iterationen)
		const requiredLength = Math.max(startIdxTime, startIdxCode) + 5;
		if (!rawValues || rawValues.length < requiredLength) {
			adapter.log.debug(`[Virtual DP] Historie für ${targetId} übersprungen: Unvollständiges Raw-Array.`);
			return;
		}

		const logList = [];
		const typesAny = luxtronikTypes;

		// Schleife läuft exakt 5-mal
		for (let i = 0; i < 5; i++) {
			const timestamp = rawValues[startIdxTime + i];
			const code = rawValues[startIdxCode + i];

			// Nur verarbeiten, wenn ein Code ungleich 0 vorliegt
			if (code !== 0) {
				const dateObject = new Date(timestamp * 1000);
				const readableDate = timestamp > 0 ? dateObject.toLocaleString("de-DE") : "Unbekannt";

				let beschreibung = `${fallbackPrefix} (${code})`;

				// Dynamische Durchsuchung aller übergebenen Wörterbuch-Schlüssel in der Luxtronik-Lib
				for (const dictKey of dictKeys) {
					if (typesAny[dictKey] && typesAny[dictKey][code]) {
						beschreibung = typesAny[dictKey][code];
						break; // Text gefunden, Schleife abbrechen
					} else if (typesAny[code]) {
						beschreibung = typesAny[code]; // Letzter Fallback
						break;
					}
				}

				logList.push({
					index: i + 1,
					code: code,
					beschreibung: beschreibung,
					datum: readableDate,
					timestamp: timestamp,
				});
			}
		}

		const jsonString = JSON.stringify(logList);
		await adapter.setStateChangedAsync(targetId, jsonString, true);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Generierung der JSON-Historie für ${targetId}: ${err.message}`);
	}
}

/**
 * Aktualisiert die Fehlerhistorie (JSON) im ioBroker.
 *
 * @param adapter Die Instanz des ioBroker-Adapters (this)
 * @param rawValues Das Array der rohen Messwerte (Befehl 3004)
 */
export async function updateErrorHistory(adapter: any, rawValues: number[]): Promise<void> {
	await updateHistory(
		adapter,
		rawValues,
		95, // Start-Index für Zeitstempel
		100, // Start-Index für Codes
		"Informationen.06_Fehlerspeicher.Fehlerspeicher",
		["errorCodes", "codes"],
		"Unbekannter Fehler",
	);
}

/**
 * Aktualisiert die Abschalthistorie (JSON) im ioBroker.
 *
 * @param adapter Die Instanz des ioBroker-Adapters (this)
 * @param rawValues Das Array der rohen Messwerte (Befehl 3004)
 */
export async function updateOutageHistory(adapter: any, rawValues: number[]): Promise<void> {
	await updateHistory(
		adapter,
		rawValues,
		111, // Start-Index für Zeitstempel
		106, // Start-Index für Codes
		"Informationen.07_Abschaltungen.Abschaltungen",
		["outageCodes", "outages", "switchOffCodes"],
		"Unbekannter Abschaltgrund",
	);
}

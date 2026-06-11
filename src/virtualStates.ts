import { STATE_MAPPING } from "./stateMapping";
const luxtronikUtils = require("luxtronik2/utils");

/**
 * Erstellt alle virtuellen Datenpunkte dynamisch im ioBroker,
 * initialisiert deren Werte und abonniert Schreib-Kanäle.
 *
 * @param adapter Die Instanz des aktuellen ioBroker-Adapters (this)
 */
export async function initializeVirtualStates(adapter: any): Promise<void> {
	try {
		for (const [key, definition] of Object.entries(STATE_MAPPING)) {
			if (definition.isVirtual) {
				const folderId = definition.folder;
				const fullId = `${folderId}.${key}`;

				// --- 1. NEU: Zuerst den Channel (Ordner) anlegen! ---
				await adapter.setObjectNotExistsAsync(folderId, {
					type: "channel",
					common: { name: folderId.split(".").pop() || folderId },
					native: {},
				});

				// --- 2. Danach den eigentlichen Datenpunkt (State) anlegen ---
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

				// --- 3. Initialwert setzen ---
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
 * Berechnet die Gesamt-Betriebsstunden aus Heizung und Warmwasser
 * und schreibt das Ergebnis in den virtuellen Datenpunkt.
 *
 * @param adapter Die Instanz des aktuellen ioBroker-Adapters (this)
 */
export async function calculateTotalHours(adapter: any): Promise<void> {
	try {
		// 1. Die beiden aktuellen Zustände aus dem ioBroker einlesen (über die übergebene Adapter-Instanz)
		const heatingState = await adapter.getStateAsync("Informationen.Betriebsstunden.hours_heating");
		const warmwaterState = await adapter.getStateAsync("Informationen.Betriebsstunden.hours_warmwater");

		// 2. Werte prüfen und falls vorhanden als Zahl sichern (sonst Fallback auf 0)
		const hoursHeating = heatingState && typeof heatingState.val === "number" ? heatingState.val : 0;
		const hoursWarmwater = warmwaterState && typeof warmwaterState.val === "number" ? warmwaterState.val : 0;

		// 3. Die magische Summe bilden
		const totalHours = hoursHeating + hoursWarmwater;

		// 4. Den virtuellen Datenpunkt mit Bestätigung (ack: true) beschreiben
		await adapter.setStateAsync("Informationen.Betriebsstunden.Betriebsstunden_Gesamt", totalHours, true);

		//	adapter.log.debug(
		//		`[Virtual DP] Gesamtstunden aktualisiert: ${totalHours}h (${hoursHeating}h Heizung + ${hoursWarmwater}h WW)`,
		//	);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Berechnung der Gesamt-Betriebsstunden: ${err.message}`);
	}
}

/**
 * Liest die Fehler-Indizes direkt aus der 3004-Liste (Messwerte) aus
 * und baut ein strukturiertes JSON-Array für den ioBroker.
 *
 * @param adapter Die Instanz des aktuellen ioBroker-Adapters
 * @param adapter
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

		// Schleife läuft 5-mal (für Fehler 1 bis Fehler 5)
		for (let i = 0; i < 5; i++) {
			// DEINE ZUORDNUNG:
			const errorTimestamp = rawValues[95 + i]; // Index 95, 96, 97, 98, 99
			const errorCode = rawValues[100 + i]; // Index 100, 101, 102, 103, 104

			// Nur verarbeiten, wenn auch wirklich ein Fehler hinterlegt ist (Code ungleich 0)
			if (errorCode !== 0) {
				// Unix-Timestamp in Millisekunden (* 1000) umwandeln und als deutsches Datum formatieren
				const dateObject = new Date(errorTimestamp * 1000);
				const readableDate = errorTimestamp > 0 ? dateObject.toLocaleString("de-DE") : "Unbekannt";

				// Klartext-Beschreibung aus der Utils-Datei holen
				const fehlerText = luxtronikUtils.errorCodes[errorCode] || "Unbekannter Fehler";

				errorLogList.push({
					index: i + 1,
					code: errorCode,
					beschreibung: fehlerText,
					datum: readableDate,
					timestamp: errorTimestamp,
				});
			}
		}

		const jsonString = JSON.stringify(errorLogList);
		await adapter.setStateChangedAsync("Informationen.Fehlerspeicher.error_history", jsonString, true);

		adapter.log.debug(`[Virtual DP] RAW-Fehlerhistorie aktualisiert. ${errorLogList.length} Einträge hinterlegt.`);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Generierung der RAW-JSON-Fehlerhistorie: ${err.message}`);
	}
}

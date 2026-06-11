import { STATE_MAPPING } from "./stateMapping";

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
 * Verarbeitet das fertige Fehler-Array der Coolchip-Bibliothek
 * und baut ein strukturiertes JSON-Array für den ioBroker.
 *
 * @param adapter Die Instanz des aktuellen ioBroker-Adapters
 * @param coolchipErrors Das originale errors-Array aus pump.read()
 */
export async function updateErrorHistory(adapter: any, coolchipErrors: any[]): Promise<void> {
	try {
		if (!coolchipErrors || !Array.isArray(coolchipErrors)) {
			adapter.log.debug("[Virtual DP] Keine gültige Fehlerliste von Coolchip erhalten.");
			return;
		}

		const errorLogList = [];

		// Wir laufen durch das von Coolchip gelieferte Array
		for (let i = 0; i < coolchipErrors.length; i++) {
			const err = coolchipErrors[i];
			adapter.log.debug(
				err
					? `[Virtual DP] Fehler ${i + 1}: Code=${err.code}, Timestamp=${err.timestamp}`
					: `[Virtual DP] Fehler ${i + 1}: Kein Fehler (Code=0)`,
			);
			// Nur hinzufügen, wenn ein echter Fehlercode existiert und ungleich 0 ist
			if (err && err.code && err.code !== 0) {
				// Coolchip liefert den Zeitstempel meistens als Unix-Timestamp (Sekunden)
				const errorTimestamp = err.timestamp;
				const dateObject = new Date(errorTimestamp * 1000);
				const readableDate = errorTimestamp > 0 ? dateObject.toLocaleString("de-DE") : "Unbekannt";

				errorLogList.push({
					index: i + 1,
					code: err.code,
					datum: readableDate,
					timestamp: errorTimestamp,
				});
			}
		}

		const jsonString = JSON.stringify(errorLogList);
		await adapter.setStateChangedAsync("Informationen.Fehlerspeicher.Fehlerspeicher", jsonString, true);

		adapter.log.debug(
			`[Virtual DP] Fehlerhistorie über Coolchip-Modul aktualisiert. ${errorLogList.length} Einträge.`,
		);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der JSON-Fehlerhistorie via Coolchip: ${err.message}`);
	}
}

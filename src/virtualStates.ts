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
			// Nur verarbeiten, wenn der Datenpunkt als virtuell markiert ist
			if (definition.isVirtual) {
				const fullId = `${definition.folder}.${key}`;

				adapter.log.info(`[Virtual DP] Erstelle/Prüfe virtuellen Datenpunkt: ${fullId}`);

				// 1. Objekt anlegen, falls es noch nicht existiert
				await adapter.setObjectNotExistsAsync(fullId, {
					type: "state",
					common: {
						name: definition.name,
						type: definition.type,
						role: definition.role,
						unit: definition.unit,
						read: true,
						write: !!definition.write,
						states: definition.states,
					},
					native: {},
				});

				// 2. Initialen Standardwert setzen, falls der Punkt komplett neu (null) ist
				const currentState = await adapter.getStateAsync(fullId);
				if (!currentState) {
					const defaultVal = definition.type === "number" ? 0 : definition.type === "boolean" ? false : "";
					await adapter.setStateAsync(fullId, { val: defaultVal, ack: true });
				}

				// 3. Wenn der virtuelle Punkt beschreibbar ist (wie Activate_Zip), den Status abonnieren
				if (definition.write) {
					await adapter.subscribeStatesAsync(fullId);
					adapter.log.info(`[Virtual DP] Schreib-Kanal abonniert für: ${fullId}`);
				}
			}
		}
	} catch (err: any) {
		adapter.log.error(`Fehler bei der automatischen Initialisierung der virtuellen Datenpunkte: ${err.message}`);
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

		adapter.log.debug(
			`[Virtual DP] Gesamtstunden aktualisiert: ${totalHours}h (${hoursHeating}h Heizung + ${hoursWarmwater}h WW)`,
		);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Berechnung der Gesamt-Betriebsstunden: ${err.message}`);
	}
}

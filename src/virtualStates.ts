/**
 * Berechnet die Gesamt-Betriebsstunden aus Heizung und Warmwasser
 * und schreibt das Ergebnis in den virtuellen Datenpunkt.
 *
 * @param adapter Die Instanz des aktuellen ioBroker-Adapters (this)
 */
export async function calculateTotalHours(adapter: any): Promise<void> {
	try {
		// 1. Die beiden aktuellen Zustände aus dem ioBroker einlesen (über die übergebene Adapter-Instanz)
		const heatingState = await adapter.getStateAsync("Informationen.Statistik.hours_heating");
		const warmwaterState = await adapter.getStateAsync("Informationen.Statistik.hours_warmwater");

		// 2. Werte prüfen und falls vorhanden als Zahl sichern (sonst Fallback auf 0)
		const hoursHeating = heatingState && typeof heatingState.val === "number" ? heatingState.val : 0;
		const hoursWarmwater = warmwaterState && typeof warmwaterState.val === "number" ? warmwaterState.val : 0;

		// 3. Die magische Summe bilden
		const totalHours = hoursHeating + hoursWarmwater;

		// 4. Den virtuellen Datenpunkt mit Bestätigung (ack: true) beschreiben
		await adapter.setStateAsync("Informationen.Statistik.hours_total_calculated", totalHours, true);

		adapter.log.debug(
			`[Virtual DP] Gesamtstunden aktualisiert: ${totalHours}h (${hoursHeating}h Heizung + ${hoursWarmwater}h WW)`,
		);
	} catch (err: any) {
		adapter.log.error(`Fehler bei der Berechnung der Gesamt-Betriebsstunden: ${err.message}`);
	}
}

// Datei: src/stateMapping.ts

/**
 * Definiert die Struktur für einen ioBroker-Datenpunkt.
 * Wird genutzt, um die Luxtronik-Werte dynamisch anzulegen.
 */
export interface StateDefinition {
	/** Name des Datenpunkts */
	name: string;
	/** ioBroker-Rolle des Datenpunkts */
	role: string;
	/** Datentyp des Datenpunkts */
	type: "number" | "string" | "boolean";
	/** Einheit des Wertes (optional) */
	unit?: string;
	/** Schreibzugriff erlaubt (optional) */
	write?: boolean;
}

/**
 * Mapping-Katalog für die Luxtronik-Werte.
 * Übersetzt die englischen API-Schlüssel in saubere ioBroker-Datenpunkte.
 */
export const STATE_MAPPING: Record<string, StateDefinition> = {
	temperature_supply: { name: "Vorlauftemperatur", role: "value.temperature", type: "number", unit: "°C" },
	temperature_return: { name: "Rücklauftemperatur", role: "value.temperature", type: "number", unit: "°C" },
	temperature_outside: { name: "Außentemperatur", role: "value.temperature", type: "number", unit: "°C" },
	temperature_hot_water: { name: "Warmwassertemperatur", role: "value.temperature", type: "number", unit: "°C" },
	status_heating: { name: "Status Heizung", role: "indicator", type: "boolean" },
};

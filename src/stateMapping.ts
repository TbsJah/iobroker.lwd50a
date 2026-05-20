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
	/** Verzeichnis */
	folder: string;
	/** Die ID, die luxtronik2 zum Schreiben erwartet */
	luxWriteId?: string;
	/** Optionaler Minimalwert */
	min?: number;
	/** Optionaler Maximalwert */
	max?: number;
	/** Optionales Mapping für numerische Werte zu Texten (z.B. für Dropdowns) */
	states?: Record<number, string>;
}

/**
 * Mapping-Katalog für die Luxtronik-Werte.
 * Übersetzt die englischen API-Schlüssel in saubere ioBroker-Datenpunkte.
 */
export const STATE_MAPPING: Record<string, StateDefinition> = {
	heating_operation_mode: {
		folder: "Modus",
		name: "Betriebsart Heizung",
		role: "value", // "level.mode" passt perfekt für Dropdowns
		type: "number",
		write: true,
		luxWriteId: "heating_operation_mode",
		states: {
			0: "Automatik",
			1: "Zusatzheizung",
			2: "Party",
			3: "Ferien",
			4: "Aus",
		},
	},

	heating_operation_mode_string: {
		folder: "Modus",
		name: "heating_operation_mode_string",
		role: "text",
		type: "string",
	},

	temperature_supply: {
		folder: "Temperaturen",
		name: "Vorlauftemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_return: {
		folder: "Temperaturen",
		name: "Rücklauftemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_outside: {
		folder: "Temperaturen",
		name: "Außentemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_hot_water: {
		folder: "Temperaturen",
		name: "Warmwasser Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_hot_water_target: {
		folder: "Temperaturen",
		name: "Warmwassertemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	warmwater_temperature: {
		folder: "Parameter",
		name: "Warmwasser Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "temperature_hot_water_target",
		min: 40,
		max: 65,
	},
	heatpump_state_string: {
		folder: "Information",
		name: "Status Text",
		role: "text",
		type: "string",
	},
	heatpump_extendet_state_string: {
		folder: "Information",
		name: "Status Text Erweitert",
		role: "text",
		type: "string",
	},
};

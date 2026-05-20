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
	LuxID?: string;
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
	//Einstellungen.Betriebsart
	heating_operation_mode: {
		folder: "Einstellungen.Betriebsart",
		name: "Betriebsart Heizung",
		role: "value", // "level.mode" passt perfekt für Dropdowns
		type: "number",
		write: true,
		LuxID: "heating_operation_mode",
		states: {
			0: "Automatik",
			1: "Zusatzheizung",
			2: "Party",
			3: "Ferien",
			4: "Aus",
		},
	},
	warmwater_operation_mode: {
		folder: "Einstellungen.Betriebsart",
		name: "Betriebsart Warmwasser",
		role: "value", // "level.mode" passt perfekt für Dropdowns
		type: "number",
		write: true,
		LuxID: "warmwater_operation_mode",
		states: {
			0: "Automatik",
			1: "Zusatzheizung",
			2: "Party",
			3: "Ferien",
			4: "Aus",
		},
	},

	//Einstellungen.Temperaturen
	heating_curve_end_point: {
		folder: "Temperaturen",
		name: "Heizkurve Endpunkt-Offset",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		LuxID: "heating_curve_end_point",
		min: 20,
		max: 35,
	},
	heating_curve_parallel_offset: {
		folder: "Temperaturen",
		name: "Heizkurve Endpunkt-Offset",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		LuxID: "heating_curve_parallel_offset",
		min: 20,
		max: 35,
	},

	//Informationen.Betriebsmodus
	heating_operation_mode_string: {
		folder: "Informationen.Betriebsmodus",
		name: "Betriebsart Heizung",
		role: "text",
		type: "string",
	},
	warmwater_operation_mode_string: {
		folder: "Informationen.Betriebsmodus",
		name: "Betriebsart Warmwasser",
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
	temperature_hot_water_target: {
		folder: "Temperaturen",
		name: "Warmwasser Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		LuxID: "temperature_hot_water_target",
		min: 40,
		max: 65,
	},
	warmwater_temperature: {
		folder: "Parameter",
		name: "Warmwasser Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		LuxID: "temperature_hot_water_target",
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

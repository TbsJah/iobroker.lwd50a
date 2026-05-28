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
// Datei: src/stateMapping.ts

/**
 * Mapping-Katalog für die Luxtronik-Werte.
 */
export const STATE_MAPPING: Record<string, StateDefinition> = {
	// ==========================================
	// EINSTELLUNGEN & PARAMETER (Beschreibbar)
	// ==========================================
	heating_target_temperature: {
		folder: "Einstellungen.Heizung",
		name: "Heizung Soll-Temperatur (Wunschwert)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "heating_target_temperature",
		min: 15,
		max: 35,
	},
	warmwater_target_temperature: {
		folder: "Einstellungen.Warmwasser",
		name: "Warmwasser Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "warmwater_target_temperature",
		min: 30,
		max: 65,
	},

	// --- HEIZKURVE (HAUPT-HEIZKREIS) ---
	heating_curve_end_point: {
		folder: "Einstellungen.Heizung",
		name: "Heizkurve Endpunkt (Rücklauf)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "heating_curve_end_point",
		min: 20,
		max: 45,
	},
	heating_curve_parallel_offset: {
		folder: "Einstellungen.Heizung",
		name: "Heizkurve Parallelverschiebung",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "heating_curve_parallel_offset",
		min: -5,
		max: 5,
	},
	deltaHeatingReduction: {
		folder: "Einstellungen.Heizung",
		name: "Heizung Nachtabsenkung (Delta)",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "deltaHeatingReduction",
		min: -10,
		max: 10,
	},

	// --- MISCHKREIS 1 ---
	mk1_curve_end_point: {
		folder: "Einstellungen.Mischkreis1",
		name: "MK1 Heizkurve Endpunkt",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "mk1_curve_end_point",
		min: 20,
		max: 50,
	},
	mk1_curve_parallel_offset: {
		folder: "Einstellungen.Mischkreis1",
		name: "MK1 Heizkurve Parallelverschiebung",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "mk1_curve_parallel_offset",
		min: -5,
		max: 5,
	},
	deltaMk1Reduction: {
		folder: "Einstellungen.Mischkreis1",
		name: "MK1 Nachtabsenkung (Delta)",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "deltaMk1Reduction",
		min: -10,
		max: 10,
	},

	// --- MISCHKREIS 2 ---
	mk2_curve_end_point: {
		folder: "Einstellungen.Mischkreis2",
		name: "MK2 Heizkurve Endpunkt",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "mk2_curve_end_point",
		min: 20,
		max: 50,
	},
	mk2_curve_parallel_offset: {
		folder: "Einstellungen.Mischkreis2",
		name: "MK2 Heizkurve Parallelverschiebung",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "mk2_curve_parallel_offset",
		min: -5,
		max: 5,
	},
	deltaMk2Reduction: {
		folder: "Einstellungen.Mischkreis2",
		name: "MK2 Nachtabsenkung (Delta)",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "deltaMk2Reduction",
		min: -10,
		max: 10,
	},

	// --- MISCHKREIS 3 ---
	mk3_curve_end_point: {
		folder: "Einstellungen.Mischkreis3",
		name: "MK3 Heizkurve Endpunkt",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "mk3_curve_end_point",
		min: 20,
		max: 50,
	},
	mk3_curve_parallel_offset: {
		folder: "Einstellungen.Mischkreis3",
		name: "MK3 Heizkurve Parallelverschiebung",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "mk3_curve_parallel_offset",
		min: -5,
		max: 5,
	},
	deltaMk3Reduction: {
		folder: "Einstellungen.Mischkreis3",
		name: "MK3 Nachtabsenkung (Delta)",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "deltaMk3Reduction",
		min: -10,
		max: 10,
	},

	// --- BETRIEBSARTEN ---
	heating_operation_mode: {
		folder: "Einstellungen.Allgemein",
		name: "Betriebsart Heizung",
		role: "level.mode",
		type: "number",
		write: true,
		luxWriteId: "heating_operation_mode",
		states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" },
	},
	warmwater_operation_mode: {
		folder: "Einstellungen.Allgemein",
		name: "Betriebsart Warmwasser",
		role: "level.mode",
		type: "number",
		write: true,
		luxWriteId: "warmwater_operation_mode",
		states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" },
	},
	cooling_operation_mode: {
		folder: "Einstellungen.Allgemein",
		name: "Betriebsart Kühlung",
		role: "level.mode",
		type: "number",
		write: true,
		luxWriteId: "cooling_operation_mode",
		states: { 0: "Aus", 1: "Automatik" },
	},

	// --- KÜHLUNG ---
	cooling_release_temp: {
		folder: "Einstellungen.Kuehlung",
		name: "Kühlung Freigabe-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "cooling_release_temp",
		min: 15,
		max: 30,
	},
	cooling_inlet_temp: {
		folder: "Einstellungen.Kuehlung",
		name: "Kühlung Vorlauf-Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "cooling_inlet_temp",
		min: 15,
		max: 25,
	},
	cooling_start: {
		folder: "Einstellungen.Kuehlung",
		name: "Kühlung Start-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "cooling_start",
	},
	cooling_stop: {
		folder: "Einstellungen.Kuehlung",
		name: "Kühlung Stopp-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "cooling_stop",
	},

	// --- HYSTERESEN ---
	hotwater_temperature_hysteresis: {
		folder: "Einstellungen.Warmwasser",
		name: "Warmwasser Hysterese",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "hotwater_temperature_hysteresis",
		min: 1,
		max: 15,
	},
	return_temperature_hysteresis: {
		folder: "Einstellungen.Heizung",
		name: "Rücklauftemperatur Hysterese",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		luxWriteId: "return_temperature_hysteresis",
		min: 1,
		max: 5,
	},
	heating_temperature_outside_2nd_compressor: {
		folder: "Einstellungen.Verdichter",
		name: "Freigabe 2. Verdichter (Außentemperatur)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "heating_temperature_outside_2nd_compressor",
		min: -20,
		max: 10,
	},
	hotwater_temperature_forerun_2nd_compressor: {
		folder: "Einstellungen.Verdichter",
		name: "Freigabe 2. Verdichter (Warmwasser-Vorlauf)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "hotwater_temperature_forerun_2nd_compressor",
		min: 10,
		max: 60,
	},

	// --- PUMPEN ---
	heating_system_circ_pump_voltage_nominal: {
		folder: "Einstellungen.Pumpen",
		name: "Heizungsumwälzpumpe Nennspannung",
		role: "value.voltage",
		type: "number",
		unit: "V",
		write: true,
		luxWriteId: "heating_system_circ_pump_voltage_nominal",
		min: 3,
		max: 10,
	},
	heating_system_circ_pump_voltage_minimal: {
		folder: "Einstellungen.Pumpen",
		name: "Heizungsumwälzpumpe Minimalspannung",
		role: "value.voltage",
		type: "number",
		unit: "V",
		write: true,
		luxWriteId: "heating_system_circ_pump_voltage_minimal",
		min: 3,
		max: 10,
	},

	// --- ENTLÜFTUNG ---
	runDeaerate: {
		folder: "Einstellungen.Spezial",
		name: "Entlüftungsprogramm starten",
		role: "switch",
		type: "number",
		write: true,
		luxWriteId: "runDeaerate",
		states: { 0: "AUS", 1: "EIN" },
	},
	hotWaterCircPumpDeaerate: {
		folder: "Einstellungen.Spezial",
		name: "Zirkulationspumpe entlüften",
		role: "switch",
		type: "number",
		write: true,
		luxWriteId: "hotWaterCircPumpDeaerate",
		states: { 0: "AUS", 1: "EIN" },
	},
	solarPumpDeaerate: {
		folder: "Einstellungen.Spezial",
		name: "Solarpumpe entlüften",
		role: "switch",
		type: "number",
		write: true,
		luxWriteId: "solarPumpDeaerate",
		states: { 0: "AUS", 1: "EIN" },
	},

	// ==========================================
	// INFORMATIONEN: TEMPERATUREN
	// ==========================================
	temperature_supply: {
		folder: "Informationen.Temperaturen",
		name: "Vorlauftemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_return: {
		folder: "Informationen.Temperaturen",
		name: "Rücklauftemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_outside: {
		folder: "Informationen.Temperaturen",
		name: "Außentemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_hot_water: {
		folder: "Informationen.Temperaturen",
		name: "Warmwassertemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_heat_source_in: {
		folder: "Informationen.Temperaturen",
		name: "Wärmequelle Eintritt",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_heat_source_out: {
		folder: "Informationen.Temperaturen",
		name: "Wärmequelle Austritt",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_mixer1_flow: {
		folder: "Informationen.Temperaturen",
		name: "Mischkreis 1 Vorlauf Ist",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_mixer1_target: {
		folder: "Informationen.Temperaturen",
		name: "Mischkreis 1 Vorlauf Soll",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_mixer3_flow: {
		folder: "Informationen.Temperaturen",
		name: "Mischkreis 3 Vorlauf Ist",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_mixer3_target: {
		folder: "Informationen.Temperaturen",
		name: "Mischkreis 3 Vorlauf Soll",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperaturw_RFV: {
		folder: "Informationen.Temperaturen",
		name: "Raumfernversteller RFV1",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	Temperatur_RFV2: {
		folder: "Informationen.Temperaturen",
		name: "Raumfernversteller RFV2",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	Temperatur_RFV3: {
		folder: "Informationen.Temperaturen",
		name: "Raumfernversteller RFV3",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_solar_collector: {
		folder: "Informationen.Temperaturen",
		name: "Solar-Kollektortemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_solar_storage: {
		folder: "Informationen.Temperaturen",
		name: "Solar-Speichertemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_external_source: {
		folder: "Informationen.Temperaturen",
		name: "Externe Energiequelle Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	Temp_Lueftung_Zuluft: {
		folder: "Informationen.Temperaturen",
		name: "Lüftung Zuluft Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	Temp_Lueftung_Abluft: {
		folder: "Informationen.Temperaturen",
		name: "Lüftung Abluft Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},

	// ==========================================
	// INFORMATIONEN: KÄLTEKREIS (Temperaturen & Regelung)
	// ==========================================
	temperature_overheating_target: {
		folder: "Informationen.Kaeltekreis",
		name: "Überhitzung Soll",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_compressor1_heating: {
		folder: "Informationen.Kaeltekreis",
		name: "Heißgas Kompressor 1",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_overheating: {
		folder: "Informationen.Kaeltekreis",
		name: "Überhitzung Ist",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_intake_compressor1: {
		folder: "Informationen.Kaeltekreis",
		name: "Saugstatus Kompressor 1 Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	temperature_intake_evaporation: {
		folder: "Informationen.Kaeltekreis",
		name: "Saugstatus Verdampfer Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},

	// ==========================================
	// INFORMATIONEN: DIGITALE & ANALOGE EINGÄNGE
	// ==========================================
	ASDin: {
		folder: "Informationen.Eingaenge",
		name: "Abtau-Endeschalter ASD",
		role: "value",
		type: "number",
	},
	BWTin: {
		folder: "Informationen.Eingaenge",
		name: "Brauchwasserthermostat BWT",
		role: "value",
		type: "number",
	},
	EVUin: {
		folder: "Informationen.Eingaenge",
		name: "EVU-Sperre",
		role: "value",
		type: "number",
	},
	HDin: {
		folder: "Informationen.Eingaenge",
		name: "Hochdruckwächter HD",
		role: "value",
		type: "number",
	},
	MOTin: {
		folder: "Informationen.Eingaenge",
		name: "Motorschutz MOT",
		role: "value",
		type: "number",
	},
	NDin: {
		folder: "Informationen.Eingaenge",
		name: "Niederdruckwächter ND",
		role: "value",
		type: "number",
	},
	NDin_pressure: {
		folder: "Informationen.Eingaenge",
		name: "Niederdruck-Sensorwert",
		role: "value.pressure",
		type: "number",
		unit: "bar",
	},
	HDin_pressure: {
		folder: "Informationen.Eingaenge",
		name: "Hochdruck-Sensorwert",
		role: "value.pressure",
		type: "number",
		unit: "bar",
	},
	PEXin: {
		folder: "Informationen.Eingaenge",
		name: "Externer Druckwächter PEX",
		role: "value",
		type: "number",
	},
	SWTin: {
		folder: "Informationen.Eingaenge",
		name: "Schwimmbadthermostat SWT",
		role: "value",
		type: "number",
	},
	AnalogIn: {
		folder: "Informationen.Eingaenge",
		name: "Analoger Eingang 1",
		role: "value",
		type: "number",
		unit: "V",
	},
	AnalogIn2: {
		folder: "Informationen.Eingaenge",
		name: "Analoger Eingang 2",
		role: "value",
		type: "number",
		unit: "V",
	},
	AnalogIn3: {
		folder: "Informationen.Eingaenge",
		name: "Analoger Eingang 3",
		role: "value",
		type: "number",
		unit: "V",
	},
	SAXin: {
		folder: "Informationen.Eingaenge",
		name: "Eingang SAX",
		role: "value",
		type: "number",
	},
	SPLin: {
		folder: "Informationen.Eingaenge",
		name: "Eingang SPL",
		role: "value",
		type: "number",
	},

	// ==========================================
	// INFORMATIONEN: AUSGÄNGE (Aaktoren / Relais)
	// ==========================================
	AVout: {
		folder: "Informationen.Ausgaenge",
		name: "Abtauventil AV",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	BUPout: {
		folder: "Informationen.Ausgaenge",
		name: "Warmwasser-Umwälzpumpe BUP",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	HUPout: {
		folder: "Informationen.Ausgaenge",
		name: "Heizungsumwälzpumpe HUP",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	MA1out: {
		folder: "Informationen.Ausgaenge",
		name: "Mischer 1 Auf MA1",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	MZ1out: {
		folder: "Informationen.Ausgaenge",
		name: "Mischer 1 Zu MZ1",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	VENout: {
		folder: "Informationen.Ausgaenge",
		name: "Ventilator VEN",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	VBOout: {
		folder: "Informationen.Ausgaenge",
		name: "Ventilausgang Brunnen VBO",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	VD1out: {
		folder: "Informationen.Ausgaenge",
		name: "Verdichter 1 VD1",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	VD2out: {
		folder: "Informationen.Ausgaenge",
		name: "Verdichter 2 VD2",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	ZIPout: {
		folder: "Informationen.Ausgaenge",
		name: "Zirkulationspumpe ZIP",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	ZUPout: {
		folder: "Informationen.Ausgaenge",
		name: "Zusatzumwälzpumpe ZUP",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	ZW1out: {
		folder: "Informationen.Ausgaenge",
		name: "Zweiter Wärmeerzeuger 1 ZW1",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	ZW2SSTout: {
		folder: "Informationen.Ausgaenge",
		name: "ZW2 / Störungsmeldung",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	ZW3SSTout: {
		folder: "Informationen.Ausgaenge",
		name: "ZW3 / Sammelstörung",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	FP2out: {
		folder: "Informationen.Ausgaenge",
		name: "Funktionspumpe 2 FP2",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	SLPout: {
		folder: "Informationen.Ausgaenge",
		name: "Solarladepumpe SLP",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	SUPout: {
		folder: "Informationen.Ausgaenge",
		name: "Zusatzpumpe SUP",
		role: "value",
		type: "number",
	},
	MZ2out: {
		folder: "Informationen.Ausgaenge",
		name: "Mischer 2 Zu MZ2",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	MA2out: {
		folder: "Informationen.Ausgaenge",
		name: "Mischer 2 Auf MA2",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	MZ3out: {
		folder: "Informationen.Ausgaenge",
		name: "Mischer 3 Zu MZ3",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	MA3out: {
		folder: "Informationen.Ausgaenge",
		name: "Mischer 3 Auf MA3",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	FP3out: {
		folder: "Informationen.Ausgaenge",
		name: "Funktionspumpe 3 FP3",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	analogOut1: {
		folder: "Informationen.Ausgaenge",
		name: "Analoger Ausgang 1",
		role: "value",
		type: "number",
		unit: "V",
	},
	analogOut2: {
		folder: "Informationen.Ausgaenge",
		name: "Analoger Ausgang 2",
		role: "value",
		type: "number",
		unit: "V",
	},
	analogOut3: {
		folder: "Informationen.Ausgaenge",
		name: "Analoger Ausgang 3",
		role: "value",
		type: "number",
		unit: "V",
	},
	analogOut4: {
		folder: "Informationen.Ausgaenge",
		name: "Analoger Ausgang 4",
		role: "value",
		type: "number",
		unit: "V",
	},
	Out_VZU: {
		folder: "Informationen.Ausgaenge",
		name: "Ventilator Zuluft VZU",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	Out_VAB: {
		folder: "Informationen.Ausgaenge",
		name: "Ventilator Abluft VAB",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	Out_VSK: {
		folder: "Informationen.Ausgaenge",
		name: "Ausgang VSK",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	Out_FRH: {
		folder: "Informationen.Ausgaenge",
		name: "Freigabe Heizung FRH",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	defrostValve: {
		folder: "Informationen.Ausgaenge",
		name: "Status Abtauventil",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	hotWaterBoilerValve: {
		folder: "Informationen.Ausgaenge",
		name: "Status Umschaltventil Warmwasser",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	heatingSystemCircPump: {
		folder: "Informationen.Ausgaenge",
		name: "Heizungssystem Zirkulationspumpe Laufindikator",
		role: "indicator",
		type: "boolean",
	},
	heatSourceMotor: {
		folder: "Informationen.Ausgaenge",
		name: "Motor Wärmequelle",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	compressor1: {
		folder: "Informationen.Ausgaenge",
		name: "Status Kompressor 1 Laufrückmeldung",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},
	hotWaterCircPumpExtern: {
		folder: "Informationen.Ausgaenge",
		name: "Warmwasser Zirkulationspumpe Extern",
		role: "value",
		type: "number",
		states: {
			0: "Aus",
			1: "Ein",
		},
	},

	// ==========================================
	// INFORMATIONEN: STATISTIKEN & ENERGIEZÄHLER
	// ==========================================
	hours_compressor1: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Kompressor 1",
		role: "value",
		type: "number",
		unit: "h",
	},
	starts_compressor1: {
		folder: "Informationen.Statistik",
		name: "Schaltspiele Kompressor 1",
		role: "value",
		type: "number",
	},
	hours_compressor2: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Kompressor 2",
		role: "value",
		type: "number",
		unit: "h",
	},
	starts_compressor2: {
		folder: "Informationen.Statistik",
		name: "Schaltspiele Kompressor 2",
		role: "value",
		type: "number",
	},
	hours_2nd_heat_source1: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Zweiter Wärmeerzeuger 1 (Heizstab)",
		role: "value",
		type: "number",
		unit: "h",
	},
	hours_2nd_heat_source2: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Zweiter Wärmeerzeuger 2",
		role: "value",
		type: "number",
		unit: "h",
	},
	hours_2nd_heat_source3: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Zweiter Wärmeerzeuger 3",
		role: "value",
		type: "number",
		unit: "h",
	},
	hours_heatpump: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Wärmepumpe Gesamt",
		role: "value",
		type: "number",
		unit: "h",
	},
	hours_heating: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Heizbetrieb",
		role: "value",
		type: "number",
		unit: "h",
	},
	hours_warmwater: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Warmwassererzeugung",
		role: "value",
		type: "number",
		unit: "h",
	},
	hours_cooling: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Kühlbetrieb",
		role: "value",
		type: "number",
		unit: "h",
	},
	hours_solar: {
		folder: "Informationen.Statistik",
		name: "Betriebsstunden Solaranlage",
		role: "value",
		type: "number",
		unit: "h",
	},
	Zaehler_BetrZeitSW: {
		folder: "Informationen.Statistik",
		name: "Betriebsstundenzähler SW",
		role: "value",
		type: "number",
		unit: "h",
	},
	thermalenergy_heating: {
		folder: "Informationen.Statistik",
		name: "Wärmemenge Heizung Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
	},
	thermalenergy_warmwater: {
		folder: "Informationen.Statistik",
		name: "Wärmemenge Warmwasser Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
	},
	thermalenergy_pool: {
		folder: "Informationen.Statistik",
		name: "Wärmemenge Schwimmbad Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
	},
	thermalenergy_total: {
		folder: "Informationen.Statistik",
		name: "Wärmemenge Gesamt Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
	},

	// ==========================================
	// INFORMATIONEN: TIMER & VERZÖGERUNGEN
	// ==========================================
	Time_WPein_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Einschaltzeit Wärmepumpe",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_ZWE1_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Laufzeit ZWE1",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_ZWE2_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Laufzeit ZWE2",
		role: "value",
		type: "number",
		unit: "s",
	},
	Timer_EinschVerz: {
		folder: "Informationen.Timer",
		name: "Einschaltverzögerung Restzeit",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_SSPAUS_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Sperrzeit AUS",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_SSPEIN_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Sperrzeit EIN",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_VDStd_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Standzeit Verdichter",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_HRM_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Zeit HRM",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_HRW_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Zeit HRW",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_LGS_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Zeit LGS",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_SBW_akt: {
		folder: "Informationen.Timer",
		name: "Aktuelle Zeit SBW",
		role: "value",
		type: "number",
		unit: "s",
	},
	heatSourceDefrostTimer: {
		folder: "Informationen.Timer",
		name: "Abtautimer Wärmequelle",
		role: "value",
		type: "number",
		unit: "s",
	},
	Time_Heissgas: {
		folder: "Informationen.Timer",
		name: "Zeit Heißgasüberwachung",
		role: "value",
		type: "number",
		unit: "s",
	},
	ahp_Zeit: {
		folder: "Informationen.Timer",
		name: "Zeit ahp-Stufe",
		role: "value",
		type: "number",
		unit: "s",
	},

	// ==========================================
	// INFORMATIONEN: SYSTEMINFO & NETZWERK
	// ==========================================
	typeHeatpump: {
		folder: "Informationen.Systeminfo",
		name: "Wärmepumpen-Typ",
		role: "text",
		type: "string",
	},
	firmware: {
		folder: "Informationen.Systeminfo",
		name: "Firmware-Version",
		role: "text",
		type: "string",
	},
	AdresseIP_akt: {
		folder: "Informationen.Systeminfo",
		name: "Aktuelle IP-Adresse",
		role: "info.ip",
		type: "string",
	},
	SubNetMask_akt: {
		folder: "Informationen.Systeminfo",
		name: "Subnetzmaske",
		role: "info.ip",
		type: "string",
	},
	Add_Broadcast: {
		folder: "Informationen.Systeminfo",
		name: "Broadcast-Adresse",
		role: "info.ip",
		type: "string",
	},
	Add_StdGateway: {
		folder: "Informationen.Systeminfo",
		name: "Standard-Gateway",
		role: "info.ip",
		type: "string",
	},
	Comfort_exists: {
		folder: "Informationen.Systeminfo",
		name: "Comfort-Platine vorhanden",
		role: "value",
		type: "number",
	},
	Compact_exists: {
		folder: "Informationen.Systeminfo",
		name: "Compact-Bauform vorhanden",
		role: "value",
		type: "number",
	},
	LIN_exists: {
		folder: "Informationen.Systeminfo",
		name: "LIN-Bus vorhanden",
		role: "indicator",
		type: "boolean",
	},
	rawDeviceTimeCalc: {
		folder: "Informationen.Systeminfo",
		name: "Berechnete Gerätezeit",
		role: "date",
		type: "string",
	},

	// ==========================================
	// INFORMATIONEN: STATUS & CODES
	// ==========================================
	status_heating: {
		folder: "Informationen.Status",
		name: "Status Heizbetrieb",
		role: "indicator",
		type: "boolean",
	},
	bivalentLevel: {
		folder: "Informationen.Status",
		name: "Bivalenzstufe",
		role: "value",
		type: "number",
	},
	WP_BZ_akt: {
		folder: "Informationen.Status",
		name: "Aktueller Betriebszustand Code",
		role: "value",
		type: "number",
	},
	heatpump_state1: {
		folder: "Informationen.Status",
		name: "Wärmepumpen Status-Code 1",
		role: "value",
		type: "number",
	},
	heatpump_state2: {
		folder: "Informationen.Status",
		name: "Wärmepumpen Status-Code 2",
		role: "value",
		type: "number",
	},
	heatpump_state3: {
		folder: "Informationen.Status",
		name: "Wärmepumpen Status-Code 3",
		role: "value",
		type: "number",
	},
	heatpump_duration: {
		folder: "Informationen.Status",
		name: "Dauer aktueller Zustand",
		role: "value",
		type: "number",
		unit: "s",
	},
	heatpump_state_string: {
		folder: "Informationen.Status",
		name: "Wärmepumpen Status Text",
		role: "text",
		type: "string",
	},
	heatpump_extendet_state_string: {
		folder: "Informationen.Status",
		name: "Erweiterter Status Text",
		role: "text",
		type: "string",
	},
	ahp_Stufe: {
		folder: "Informationen.Status",
		name: "Aktuelle ahp-Stufe",
		role: "value",
		type: "number",
	},
	ahp_Temp: {
		folder: "Informationen.Status",
		name: "Temperatur ahp-Stufe",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	opStateHotWater: {
		folder: "Informationen.Status",
		name: "Betriebszustand Warmwasser Code",
		role: "value",
		type: "number",
	},
	opStateHotWaterString: {
		folder: "Informationen.Status",
		name: "Betriebszustand Warmwasser Text",
		role: "text",
		type: "string",
	},
	opStateHeating: {
		folder: "Informationen.Status",
		name: "Betriebszustand Heizung Code",
		role: "value",
		type: "number",
	},
	opStateHeatingString: {
		folder: "Informationen.Status",
		name: "Betriebszustand Heizung Text",
		role: "text",
		type: "string",
	},
	opStateMixer1: {
		folder: "Informationen.Status",
		name: "Betriebszustand Mischerkreis 1",
		role: "value",
		type: "number",
	},
	opStateMixer2: {
		folder: "Informationen.Status",
		name: "Betriebszustand Mischerkreis 2",
		role: "value",
		type: "number",
	},
	opStateMixer3: {
		folder: "Informationen.Status",
		name: "Betriebszustand Mischerkreis 3",
		role: "value",
		type: "number",
	},
	Einst_Kurzprogramm: {
		folder: "Informationen.Status",
		name: "Einstellung Kurzprogramm",
		role: "value",
		type: "number",
	},
	StatusSlave_1: {
		folder: "Informationen.Status",
		name: "Status Slave 1",
		role: "value",
		type: "number",
	},
	StatusSlave_2: {
		folder: "Informationen.Status",
		name: "Status Slave 2",
		role: "value",
		type: "number",
	},
	StatusSlave_3: {
		folder: "Informationen.Status",
		name: "Status Slave 3",
		role: "value",
		type: "number",
	},
	StatusSlave_4: {
		folder: "Informationen.Status",
		name: "Status Slave 4",
		role: "value",
		type: "number",
	},
	StatusSlave_5: {
		folder: "Informationen.Status",
		name: "Status Slave 5",
		role: "value",
		type: "number",
	},
	SH_SW: {
		folder: "Informationen.Status",
		name: "Status SH_SW",
		role: "value",
		type: "number",
	},
	FreigabKuehl: {
		folder: "Informationen.Status",
		name: "Freigabe Kühlung",
		role: "value",
		type: "number",
	},
	SonderZeichen: {
		folder: "Informationen.Status",
		name: "Sonderzeichen Code",
		role: "value",
		type: "number",
	},
	SH_ZIP: {
		folder: "Informationen.Status",
		name: "Status SH_ZIP",
		role: "value",
		type: "number",
	},
	WebsrvProgrammWerteBeobarten: {
		folder: "Informationen.Status",
		name: "Webserver Programmwerte Beobachten",
		role: "value",
		type: "number",
	},
	Durchfluss_WQ: {
		folder: "Informationen.Status",
		name: "Durchfluss Wärmequelle",
		role: "value",
		type: "number",
	},
	flowRate: {
		folder: "Informationen.Status",
		name: "Durchflussmenge",
		role: "value",
		type: "number",
	},

	// ==========================================
	// INFORMATIONEN: INTERNER LIN-BUS DETAILWERTE
	// ==========================================
	LIN_TUE: {
		folder: "Informationen.Status",
		name: "LIN-Bus Verdampfer-Austrittstemperatur (TUE)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	LIN_TUE1: {
		folder: "Informationen.Status",
		name: "LIN-Bus Verdampfer-Austrittstemperatur 2 (TUE1)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	LIN_VDH: {
		folder: "Informationen.Status",
		name: "LIN-Bus Heißgastemperatur Verdichter (VDH)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
	},
	LIN_UH: {
		folder: "Informationen.Status",
		name: "LIN-Bus Überhitzung Ist (UH)",
		role: "value.temperature",
		type: "number",
		unit: "K",
	},
	LIN_UH_Soll: {
		folder: "Informationen.Status",
		name: "LIN-Bus Überhitzung Soll",
		role: "value.temperature",
		type: "number",
		unit: "K",
	},
	LIN_HD: {
		folder: "Informationen.Status",
		name: "LIN-Bus Hochdruck",
		role: "value.pressure",
		type: "number",
		unit: "bar",
	},
	LIN_ND: {
		folder: "Informationen.Status",
		name: "LIN-Bus Niederdruck",
		role: "value.pressure",
		type: "number",
		unit: "bar",
	},
	LIN_VDH_out: {
		folder: "Informationen.Status",
		name: "LIN-Bus Verdichterkopfheizung Ansteuerung",
		role: "value",
		type: "number",
		unit: "%",
	},
};

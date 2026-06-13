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
	type: "number" | "string" | "boolean" | "json";
	/** Einheit des Wertes (optional) */
	unit?: string;
	/** Schreibzugriff erlaubt (optional) */
	write?: boolean;
	/** Verzeichnis */
	folder: string;
	/** Die ID, die luxtronik2 zum Schreiben/Lesen erwartet */
	luxWriteId?: string;
	/** Kennzeichnung für rein virtuelle/berechnete Datenpunkte */
	isVirtual?: boolean;
	/** Optionaler Minimalwert */
	min?: number;
	/** Optionaler Maximalwert */
	max?: number;
	/** Optionaler Umrechnungsfaktor */
	factor?: number;
	/** Optionales Mapping für numerische Werte zu Texten */
	states?: Record<number, string>;
	/** NEU: Bestimmt explizit die exakte Datenquelle an der Luxtronik */
	dataSource?: "raw_value" | "raw_parameter" | "value" | "parameter" | "additional";
}

/**
 * Mapping-Katalog für die Luxtronik-Werte.
 */
export const STATE_MAPPING: Record<string, StateDefinition> = {
	// ==========================================
	// Informationen & Values (Lesbar)
	// ==========================================
	// Temperaturen
	temperature_supply: {
		folder: "Informationen.01_Temperaturen",
		name: "Vorlauftemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_return: {
		folder: "Informationen.01_Temperaturen",
		name: "Rücklauftemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_target_return: {
		folder: "Informationen.01_Temperaturen",
		name: "Rückl.-Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_hot_gas: {
		folder: "Informationen.01_Temperaturen",
		name: "Heissgas-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_outside: {
		folder: "Informationen.01_Temperaturen",
		name: "Außentemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	Mitteltemperatur: {
		folder: "Informationen.01_Temperaturen",
		name: "Value 16 (ID_WEB_Mitteltemperatur)",
		role: "value",
		type: "number",
		write: false,
		luxWriteId: "16",
		unit: "°C",
		factor: 10,
		dataSource: "raw_value",
	},
	temperature_hot_water: {
		folder: "Informationen.01_Temperaturen",
		name: "Warmwassertemperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	Wamwassertemperatur_Ist: {
		folder: "Informationen.01_Temperaturen",
		name: "Value 17 (ID_WEB_Temperatur_TBW)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: false,
		luxWriteId: "17",
		factor: 10,
		dataSource: "raw_value",
	},
	Wamwassertemperatur_Soll: {
		folder: "Informationen.01_Temperaturen",
		name: "Value 18 (ID_WEB_Einst_BWS_akt)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: false,
		luxWriteId: "18",
		factor: 10,
		dataSource: "raw_value",
	},
	temperature_heat_source_in: {
		folder: "Informationen.01_Temperaturen",
		name: "Wärmequelle Eintritt",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_overheating_target: {
		folder: "Informationen.01_Temperaturen",
		name: "Überhitzung Soll",
		role: "value.temperature",
		type: "number",
		unit: "K",
		dataSource: "value",
	},
	temperature_compressor1_heating: {
		folder: "Informationen.01_Temperaturen",
		name: "Heißgas Kompressor 1",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_overheating: {
		folder: "Informationen.01_Temperaturen",
		name: "Überhitzung Ist",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_intake_compressor1: {
		folder: "Informationen.01_Temperaturen",
		name: "Saugstatus Kompressor 1 Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},
	temperature_intake_evaporation: {
		folder: "Informationen.01_Temperaturen",
		name: "Saugstatus Verdampfer Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		dataSource: "value",
	},

	// Eingänge
	ASDin: {
		folder: "Informationen.02_Eingaenge",
		name: "Abtau-Endeschalter ASD",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	EVUin: {
		folder: "Informationen.02_Eingaenge",
		name: "EVU-Sperre",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	HDin: {
		folder: "Informationen.02_Eingaenge",
		name: "Hochdruckwächter HD",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	MOTin: {
		folder: "Informationen.02_Eingaenge",
		name: "Motorschutz MOT",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	NDin: {
		folder: "Informationen.02_Eingaenge",
		name: "Niederdruckwächter ND",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	AnalogIn: {
		folder: "Informationen.02_Eingaenge",
		name: "Analoger Eingang 1",
		role: "value",
		type: "number",
		unit: "V",
		dataSource: "value",
	},
	NDin_pressure: {
		folder: "Informationen.02_Eingaenge",
		name: "Niederdruck-Sensorwert",
		role: "value.pressure",
		type: "number",
		unit: "bar",
		factor: 1,
		dataSource: "value",
	},
	HDin_pressure: {
		folder: "Informationen.02_Eingaenge",
		name: "Hochdruck-Sensorwert",
		role: "value.pressure",
		type: "number",
		unit: "bar",
		factor: 1,
		dataSource: "value",
	},
	BWTin: {
		folder: "Informationen.02_Eingaenge",
		name: "Brauchwasserthermostat BWT",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},

	// Ausgänge
	AVout: {
		folder: "Informationen.03_Ausgaenge",
		name: "Abtauventil AV",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	BUPout: {
		folder: "Informationen.03_Ausgaenge",
		name: "Warmwasser-Umwälzpumpe BUP",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	HUPout: {
		folder: "Informationen.03_Ausgaenge",
		name: "Heizungsumwälzpumpe HUP",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	VENout: {
		folder: "Informationen.03_Ausgaenge",
		name: "Ventilator VEN",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	VD1out: {
		folder: "Informationen.03_Ausgaenge",
		name: "Verdichter 1 VD1",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	ZIPout: {
		folder: "Informationen.03_Ausgaenge",
		name: "Zirkulationspumpe ZIP",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	ZUPout: {
		folder: "Informationen.03_Ausgaenge",
		name: "Zusatzumwälzpumpe ZUP",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	ZW1out: {
		folder: "Informationen.03_Ausgaenge",
		name: "Zweiter Wärmeerzeuger 1 ZW1",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	analogOut1: {
		folder: "Informationen.03_Ausgaenge",
		name: "Analoger Ausgang 1",
		role: "value",
		type: "number",
		unit: "V",
		dataSource: "value",
	},
	analogOut2: {
		folder: "Informationen.03_Ausgaenge",
		name: "Analoger Ausgang 2",
		role: "value",
		type: "number",
		unit: "V",
		dataSource: "value",
	},
	defrostValve: {
		folder: "Informationen.03_Ausgaenge",
		name: "Status Abtauventil",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	hotWaterBoilerValve: {
		folder: "Informationen.03_Ausgaenge",
		name: "Status Umschaltventil Warmwasser",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	heatingSystemCircPump: {
		folder: "Informationen.03_Ausgaenge",
		name: "Heizungssystem Zirkulationspumpe Laufindikator",
		role: "indicator",
		type: "boolean",
		dataSource: "value",
	},
	heatSourceMotor: {
		folder: "Informationen.03_Ausgaenge",
		name: "Motor Wärmequelle",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	compressor1: {
		folder: "Informationen.03_Ausgaenge",
		name: "Status Kompressor 1 Laufrückmeldung",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},
	hotWaterCircPumpExtern: {
		folder: "Informationen.03_Ausgaenge",
		name: "Warmwasser Zirkulationspumpe Extern",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "value",
	},

	// Zeiten
	Time_WPein_akt: {
		folder: "Informationen.04_Timer",
		name: "Aktuelle Einschaltzeit Wärmepumpe",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Time_ZWE1_akt: {
		folder: "Informationen.04_Timer",
		name: "Aktuelle Laufzeit ZWE1",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Timer_EinschVerz: {
		folder: "Informationen.04_Timer",
		name: "Einschaltverzögerung Restzeit",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Time_SSPAUS_akt: {
		folder: "Informationen.04_Timer",
		name: "Aktuelle Sperrzeit AUS",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Time_SSPEIN_akt: {
		folder: "Informationen.04_Timer",
		name: "Aktuelle Sperrzeit EIN",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Time_VDStd_akt: {
		folder: "Informationen.04_Timer",
		name: "Aktuelle Standzeit Verdichter",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Time_HRM_akt: {
		folder: "Informationen.04_Timer",
		name: "Aktuelle Zeit HRM",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Time_HRW_akt: {
		folder: "Informationen.04_Timer",
		name: "Aktuelle Zeit HRW",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	Time_Heissgas: {
		folder: "Informationen.04_Timer",
		name: "Zeit Heißgasüberwachung",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	ahp_Zeit: {
		folder: "Informationen.04_Timer",
		name: "Zeit ahp-Stufe",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},

	// Betriebsstunden
	hours_compressor1: {
		folder: "Informationen.05_Betriebsstunden",
		name: "Betriebsstunden Kompressor 1",
		role: "value",
		type: "number",
		unit: "h",
		dataSource: "value",
	},
	starts_compressor1: {
		folder: "Informationen.05_Betriebsstunden",
		name: "Schaltspiele Kompressor 1",
		role: "value",
		type: "number",
		dataSource: "value",
	},
	hours_2nd_heat_source1: {
		folder: "Informationen.05_Betriebsstunden",
		name: "Betriebsstunden Zweiter Wärmeerzeuger 1 (Heizstab)",
		role: "value",
		type: "number",
		unit: "h",
		dataSource: "value",
	},
	hours_heatpump: {
		folder: "Informationen.05_Betriebsstunden",
		name: "Betriebsstunden Wärmepumpe Gesamt",
		role: "value",
		type: "number",
		unit: "h",
		dataSource: "value",
	},
	hours_heating: {
		folder: "Informationen.05_Betriebsstunden",
		name: "Betriebsstunden Heizbetrieb",
		role: "value",
		type: "number",
		unit: "h",
		dataSource: "value",
	},
	hours_warmwater: {
		folder: "Informationen.05_Betriebsstunden",
		name: "Betriebsstunden Warmwassererzeugung",
		role: "value",
		type: "number",
		unit: "h",
		dataSource: "value",
	},

	// Fehlerspeicher
	Fehlerspeicher: {
		folder: "Informationen.06_Fehlerspeicher",
		name: "Fehlerhistorie (Die letzten 5 Fehler)",
		role: "string",
		type: "json",
		isVirtual: true,
	},

	// Abschaltungen
	Abschaltungen: {
		folder: "Informationen.07_Abschaltungen",
		name: "Abschalthistorie (Die letzten 5 Abschaltungen)",
		role: "string",
		type: "json",
		isVirtual: true,
	},

	// Betriebszustand
	WP_BZ_akt: {
		folder: "Informationen.08_Betriebszustand",
		name: "Aktueller Betriebszustand Code",
		role: "value",
		type: "number",
		states: {
			0: "Heizbetrieb",
			1: "Trinkwarmwasser",
			2: "Schwimmbad",
			3: "EVU-Sperre",
			4: "Abtauen",
			5: "Leerlauf",
			6: "Externe Energiequelle",
			7: "Kühlung",
		},
		dataSource: "value",
	},
	heatpump_extendet_state_string: {
		folder: "Informationen.08_Betriebszustand",
		name: "Erweiterter Status Text",
		role: "text",
		type: "string",
		dataSource: "value",
	},
	opStateHeating: {
		folder: "Informationen.08_Betriebszustand",
		name: "Betriebszustand Heizung",
		role: "value",
		type: "number",
		states: { 0: "Abgesenkt", 1: "Normal", 2: "Heizgrenze", 3: "Aus", 4: "Frostschutz" },
		dataSource: "value",
	},
	opStateHotWater: {
		folder: "Informationen.08_Betriebszustand",
		name: "Betriebszustand Warmwasser",
		role: "value",
		type: "number",
		states: { 0: "Aufheizen", 1: "Temp. OK", 2: "Aus", 3: "Sperrzeit" },
		dataSource: "value",
	},
	bivalentLevel: {
		folder: "Informationen.08_Betriebszustand",
		name: "Bivalenzstufe",
		role: "value",
		type: "number",
		states: {
			1: "Ein Verdichter darf laufen",
			2: "Zwei Verdichter dürfen laufen",
			3: "Zusätzlicher Wärmeerzeuger darf mitlaufen",
		},
		dataSource: "value",
	},
	heatpump_duration: {
		folder: "Informationen.08_Betriebszustand",
		name: "Dauer aktueller Zustand",
		role: "value",
		type: "number",
		unit: "s",
		dataSource: "value",
	},
	heatpump_state_string: {
		folder: "Informationen.08_Betriebszustand",
		name: "Wärmepumpen Status Text",
		role: "text",
		type: "string",
		dataSource: "value",
	},

	// Wärmemenge
	thermalenergy_heating: {
		folder: "Informationen.09_Wärmemenge",
		name: "Wärmemenge Heizung Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
		dataSource: "value",
	},
	thermalenergy_warmwater: {
		folder: "Informationen.09_Wärmemenge",
		name: "Wärmemenge Warmwasser Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
		dataSource: "value",
	},
	thermalenergy_ZWE1: {
		folder: "Informationen.09_Wärmemenge",
		name: "Wärmemenge Heizstab Erzeugt",
		role: "value.power.consumption",
		type: "number",
		luxWriteId: "1059",
		unit: "kWh",
		dataSource: "raw_parameter", // <--- HIER DER WECHSEL ZU 3003!
		factor: 100,
	},
	thermalenergy_total: {
		folder: "Informationen.09_Wärmemenge",
		name: "Wärmemenge Gesamt Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
		dataSource: "value",
	},

	// Energie
	energy_heating: {
		folder: "Informationen.10_Engergie",
		name: "Energie Heizung Erzeugt",
		role: "value.power.consumption",
		luxWriteId: "1136",
		type: "number",
		unit: "kWh",
		dataSource: "raw_parameter", // <--- HIER DER WECHSEL ZU 3003!
		factor: 100,
	},
	energy_warmwater: {
		folder: "Informationen.10_Engergie",
		name: "Energie Warmwasser Erzeugt",
		role: "value.power.consumption",
		type: "number",
		luxWriteId: "1137",
		unit: "kWh",
		dataSource: "raw_parameter", // <--- HIER DER WECHSEL ZU 3003!
		factor: 100,
	},
	energy_ZWE1: {
		folder: "Informationen.10_Engergie",
		name: "Energie Heizstab Erzeugt",
		role: "value.power.consumption",
		type: "number",
		luxWriteId: "1059",
		unit: "kWh",
		dataSource: "raw_parameter", // <--- HIER DER WECHSEL ZU 3003!
		factor: 100,
	},
	energy_total: {
		folder: "Informationen.10_Engergie",
		name: "Energie Gesamt Erzeugt",
		role: "value.power.consumption",
		type: "number",
		unit: "kWh",
		isVirtual: true, // <--- KORREKTUR: Fehlte! Wird vom Adapter selbst addiert.
	},

	// ==========================================
	// EINSTELLUNGEN & PARAMETER (Beschreibbar)
	// ==========================================
	//Betriebsmodus
	heating_operation_mode: {
		folder: "Einstellungen.01_Betriebsmodus",
		name: "Betriebsart Heizung",
		role: "level.mode",
		type: "number",
		write: true,
		states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" },
		dataSource: "parameter",
	},
	warmwater_operation_mode: {
		folder: "Einstellungen.01_Betriebsmodus",
		name: "Betriebsart Warmwasser",
		role: "level.mode",
		type: "number",
		write: true,
		states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" },
		dataSource: "parameter",
	},

	//Heizung
	heating_curve_end_point: {
		folder: "Einstellungen.02_Heizung",
		name: "Heizkurve Endpunkt (Rücklauf)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		min: 20,
		max: 45,
		dataSource: "parameter",
	},
	heating_curve_parallel_offset: {
		folder: "Einstellungen.02_Heizung",
		name: "Heizkurve Fusspunkt",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		min: 20,
		max: 45,
		dataSource: "parameter",
	},
	deltaHeatingReduction: {
		folder: "Einstellungen.02_Heizung",
		name: "Heizung Nachtabsenkung (Delta)",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		factor: 10,
		min: -10,
		max: 10,
		dataSource: "parameter",
	},
	heating_temperature: {
		folder: "Einstellungen.02_Heizung",
		name: "Heizung Verschiebng Soll-Temperatur (Wunschwert)",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "heating_target_temperature",
		min: -5,
		max: 5,
		dataSource: "parameter",
	},
	returnTemperatureHysteresis: {
		folder: "Einstellungen.02_Heizung",
		name: "Rücklauftemperatur Hysterese",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		factor: 1,
		min: 1,
		max: 5,
		dataSource: "parameter",
	},
	thresholdHeatingLimit: {
		folder: "Einstellungen.02_Heizung",
		name: "Parameter 700 (ID_Einst_Heizgrenze_Temp)",
		role: "value",
		type: "number",
		write: true,
		luxWriteId: "700",
		unit: "°C",
		factor: 10,
		dataSource: "raw_parameter",
	},
	heatingLimit: {
		folder: "Einstellungen.02_Heizung",
		name: "Parameter 699 (ID_Einst_Heizgrenze)",
		write: true,
		role: "value",
		type: "number",
		luxWriteId: "699",
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "raw_parameter",
	},

	// Warmwasser
	warmwater_temperature: {
		folder: "Einstellungen.03_Warmwasser",
		name: "Warmwasser Soll-Temperatur",
		role: "value.temperature",
		type: "number",
		unit: "°C",
		write: true,
		luxWriteId: "temperature_hot_water_target",
		min: 30,
		max: 65,
		dataSource: "parameter",
	},
	hotWaterTemperatureHysteresis: {
		folder: "Einstellungen.03_Warmwasser",
		name: "Warmwasser Hysterese",
		role: "value.temperature",
		type: "number",
		unit: "K",
		write: true,
		factor: 1,
		min: 1,
		max: 15,
		dataSource: "parameter",
	},
	heating_system_circ_pump_voltage_nominal: {
		folder: "Einstellungen.04_Pumpe",
		name: "Heizungsumwälzpumpe Nennspannung",
		role: "value.voltage",
		type: "number",
		unit: "V",
		write: true,
		factor: 1,
		min: 3,
		max: 10,
		dataSource: "parameter",
	},
	heating_system_circ_pump_voltage_minimal: {
		folder: "Einstellungen.04_Pumpe",
		name: "Heizungsumwälzpumpe Minimalspannung",
		role: "value.voltage",
		type: "number",
		unit: "V",
		write: true,
		factor: 1,
		min: 3,
		max: 10,
		dataSource: "parameter",
	},

	//Zip
	runDeaerate: {
		folder: "Einstellungen.05_Spezial",
		name: "Entlüftungsprogramm starten",
		role: "indicator",
		type: "boolean",
		write: true,
		states: { 0: "Aus", 1: "Ein" },
		dataSource: "parameter",
	},
	hotWaterCircPumpDeaerate: {
		folder: "Einstellungen.05_Spezial",
		name: "Zirkulationspumpe entlüften",
		role: "value",
		type: "number",
		states: { 0: "Aus", 1: "Ein" },
		write: true,
		dataSource: "parameter",
	},
	Activate_Zip: {
		folder: "Einstellungen.05_Spezial",
		name: "Makro: ZIP Entlüftung starten",
		role: "value",
		type: "number",
		write: true,
		states: { 0: "Aus", 1: "Ein" },
		luxWriteId: "Activate_Zip",
		isVirtual: true,
	},

	//Systemeinstellungen
	Effizienzpumpe: {
		folder: "Einstellungen.06_System-Einstellung",
		name: "Parameter 869 (ID_Einst_Effizienzpumpe_akt)",
		role: "value",
		type: "number",
		write: true,
		luxWriteId: "869",
		dataSource: "raw_parameter",
		states: { 0: "Aus", 1: "Ein" },
	},

	// 08_Systeminfo
	typeHeatpump: {
		folder: "Informationen.08_Systeminfo",
		name: "Wärmepumpen-Typ",
		role: "text",
		type: "string",
		dataSource: "value",
	},
	firmware: {
		folder: "Informationen.08_Systeminfo",
		name: "Firmware-Version",
		role: "text",
		type: "string",
		dataSource: "value",
	},
	AdresseIP_akt: {
		folder: "Informationen.08_Systeminfo",
		name: "Aktuelle IP-Adresse",
		role: "info.ip",
		type: "string",
		dataSource: "value",
	},
	SubNetMask_akt: {
		folder: "Informationen.08_Systeminfo",
		name: "Subnetzmaske",
		role: "info.ip",
		type: "string",
		dataSource: "value",
	},
	Add_Broadcast: {
		folder: "Informationen.08_Systeminfo",
		name: "Broadcast-Adresse",
		role: "info.ip",
		type: "string",
		dataSource: "value",
	},
	Add_StdGateway: {
		folder: "Informationen.08_Systeminfo",
		name: "Standard-Gateway",
		role: "info.ip",
		type: "string",
		dataSource: "value",
	},
	Comfort_exists: {
		folder: "Informationen.08_Systeminfo",
		name: "Comfort-Platine vorhanden",
		role: "value",
		type: "number",
		dataSource: "value",
	},
	Compact_exists: {
		folder: "Informationen.08_Systeminfo",
		name: "Compact-Bauform vorhanden",
		role: "value",
		type: "number",
		dataSource: "value",
	},
	LIN_exists: {
		folder: "Informationen.08_Systeminfo",
		name: "LIN-Bus vorhanden",
		role: "indicator",
		type: "boolean",
		dataSource: "value",
	},
	rawDeviceTimeCalc: {
		folder: "Informationen.08_Systeminfo",
		name: "Berechnete Gerätezeit",
		role: "date",
		type: "string",
		dataSource: "value",
	},
};

// Runtime Injection für fehlende IDs
for (const key of Object.keys(STATE_MAPPING)) {
	if (!STATE_MAPPING[key].luxWriteId) {
		STATE_MAPPING[key].luxWriteId = key;
	}
}

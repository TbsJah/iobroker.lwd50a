"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stateMapping_exports = {};
__export(stateMapping_exports, {
  STATE_MAPPING: () => STATE_MAPPING
});
module.exports = __toCommonJS(stateMapping_exports);
const STATE_MAPPING = {
  // ==========================================
  // Informationen & Values (Lesbar)
  // ==========================================
  // Temperaturen
  temperature_supply: {
    folder: "Informationen.01_Temperaturen",
    name: "Vorlauftemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_return: {
    folder: "Informationen.01_Temperaturen",
    name: "R\xFCcklauftemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_target_return: {
    folder: "Informationen.01_Temperaturen",
    name: "R\xFCckl.-Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_hot_gas: {
    folder: "Informationen.01_Temperaturen",
    name: "Heissgas-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_outside: {
    folder: "Informationen.01_Temperaturen",
    name: "Au\xDFentemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  Mitteltemperatur: {
    folder: "Informationen.01_Temperaturen",
    name: "Value 16 (ID_WEB_Mitteltemperatur)",
    role: "value",
    type: "number",
    write: false,
    luxWriteId: "16",
    unit: "\xB0C",
    factor: 10,
    dataSource: "raw_value"
  },
  temperature_hot_water: {
    folder: "Informationen.01_Temperaturen",
    name: "Warmwassertemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  Wamwassertemperatur_Ist: {
    folder: "Informationen.01_Temperaturen",
    name: "Value 17 (ID_WEB_Temperatur_TBW)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: false,
    luxWriteId: "17",
    factor: 10,
    dataSource: "raw_value"
  },
  Wamwassertemperatur_Soll: {
    folder: "Informationen.01_Temperaturen",
    name: "Value 18 (ID_WEB_Einst_BWS_akt)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: false,
    luxWriteId: "18",
    factor: 10,
    dataSource: "raw_value"
  },
  temperature_heat_source_in: {
    folder: "Informationen.01_Temperaturen",
    name: "W\xE4rmequelle Eintritt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_overheating_target: {
    folder: "Informationen.01_Temperaturen",
    name: "\xDCberhitzung Soll",
    role: "value.temperature",
    type: "number",
    unit: "K",
    dataSource: "value"
  },
  temperature_compressor1_heating: {
    folder: "Informationen.01_Temperaturen",
    name: "Hei\xDFgas Kompressor 1",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_overheating: {
    folder: "Informationen.01_Temperaturen",
    name: "\xDCberhitzung Ist",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_intake_compressor1: {
    folder: "Informationen.01_Temperaturen",
    name: "Saugstatus Kompressor 1 Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  temperature_intake_evaporation: {
    folder: "Informationen.01_Temperaturen",
    name: "Saugstatus Verdampfer Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    dataSource: "value"
  },
  // Eingänge
  ASDin: {
    folder: "Informationen.02_Eingaenge",
    name: "Abtau-Endeschalter ASD",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  EVUin: {
    folder: "Informationen.02_Eingaenge",
    name: "EVU-Sperre",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  HDin: {
    folder: "Informationen.02_Eingaenge",
    name: "Hochdruckw\xE4chter HD",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  MOTin: {
    folder: "Informationen.02_Eingaenge",
    name: "Motorschutz MOT",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  NDin: {
    folder: "Informationen.02_Eingaenge",
    name: "Niederdruckw\xE4chter ND",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  AnalogIn: {
    folder: "Informationen.02_Eingaenge",
    name: "Analoger Eingang 1",
    role: "value",
    type: "number",
    unit: "V",
    dataSource: "value"
  },
  NDin_pressure: {
    folder: "Informationen.02_Eingaenge",
    name: "Niederdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 1,
    dataSource: "value"
  },
  HDin_pressure: {
    folder: "Informationen.02_Eingaenge",
    name: "Hochdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 1,
    dataSource: "value"
  },
  BWTin: {
    folder: "Informationen.02_Eingaenge",
    name: "Brauchwasserthermostat BWT",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  // Ausgänge
  AVout: {
    folder: "Informationen.03_Ausgaenge",
    name: "Abtauventil AV",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  BUPout: {
    folder: "Informationen.03_Ausgaenge",
    name: "Warmwasser-Umw\xE4lzpumpe BUP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  HUPout: {
    folder: "Informationen.03_Ausgaenge",
    name: "Heizungsumw\xE4lzpumpe HUP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  VENout: {
    folder: "Informationen.03_Ausgaenge",
    name: "Ventilator VEN",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  VD1out: {
    folder: "Informationen.03_Ausgaenge",
    name: "Verdichter 1 VD1",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  ZIPout: {
    folder: "Informationen.03_Ausgaenge",
    name: "Zirkulationspumpe ZIP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  ZUPout: {
    folder: "Informationen.03_Ausgaenge",
    name: "Zusatzumw\xE4lzpumpe ZUP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  ZW1out: {
    folder: "Informationen.03_Ausgaenge",
    name: "Zweiter W\xE4rmeerzeuger 1 ZW1",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  analogOut1: {
    folder: "Informationen.03_Ausgaenge",
    name: "Analoger Ausgang 1",
    role: "value",
    type: "number",
    unit: "V",
    dataSource: "value"
  },
  analogOut2: {
    folder: "Informationen.03_Ausgaenge",
    name: "Analoger Ausgang 2",
    role: "value",
    type: "number",
    unit: "V",
    dataSource: "value"
  },
  defrostValve: {
    folder: "Informationen.03_Ausgaenge",
    name: "Status Abtauventil",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  hotWaterBoilerValve: {
    folder: "Informationen.03_Ausgaenge",
    name: "Status Umschaltventil Warmwasser",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  heatingSystemCircPump: {
    folder: "Informationen.03_Ausgaenge",
    name: "Heizungssystem Zirkulationspumpe Laufindikator",
    role: "indicator",
    type: "boolean",
    dataSource: "value"
  },
  heatSourceMotor: {
    folder: "Informationen.03_Ausgaenge",
    name: "Motor W\xE4rmequelle",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  compressor1: {
    folder: "Informationen.03_Ausgaenge",
    name: "Status Kompressor 1 Laufr\xFCckmeldung",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  hotWaterCircPumpExtern: {
    folder: "Informationen.03_Ausgaenge",
    name: "Warmwasser Zirkulationspumpe Extern",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "value"
  },
  // Zeiten
  Time_WPein_akt: {
    folder: "Informationen.04_Timer",
    name: "Aktuelle Einschaltzeit W\xE4rmepumpe",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Time_ZWE1_akt: {
    folder: "Informationen.04_Timer",
    name: "Aktuelle Laufzeit ZWE1",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Timer_EinschVerz: {
    folder: "Informationen.04_Timer",
    name: "Einschaltverz\xF6gerung Restzeit",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Time_SSPAUS_akt: {
    folder: "Informationen.04_Timer",
    name: "Aktuelle Sperrzeit AUS",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Time_SSPEIN_akt: {
    folder: "Informationen.04_Timer",
    name: "Aktuelle Sperrzeit EIN",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Time_VDStd_akt: {
    folder: "Informationen.04_Timer",
    name: "Aktuelle Standzeit Verdichter",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Time_HRM_akt: {
    folder: "Informationen.04_Timer",
    name: "Aktuelle Zeit HRM",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Time_HRW_akt: {
    folder: "Informationen.04_Timer",
    name: "Aktuelle Zeit HRW",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  Time_Heissgas: {
    folder: "Informationen.04_Timer",
    name: "Zeit Hei\xDFgas\xFCberwachung",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  ahp_Zeit: {
    folder: "Informationen.04_Timer",
    name: "Zeit ahp-Stufe",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  // Betriebsstunden
  hours_compressor1: {
    folder: "Informationen.05_Betriebsstunden",
    name: "Betriebsstunden Kompressor 1",
    role: "value",
    type: "number",
    unit: "h",
    dataSource: "value"
  },
  starts_compressor1: {
    folder: "Informationen.05_Betriebsstunden",
    name: "Schaltspiele Kompressor 1",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  hours_2nd_heat_source1: {
    folder: "Informationen.05_Betriebsstunden",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 1 (Heizstab)",
    role: "value",
    type: "number",
    unit: "h",
    dataSource: "value"
  },
  hours_heatpump: {
    folder: "Informationen.05_Betriebsstunden",
    name: "Betriebsstunden W\xE4rmepumpe Gesamt",
    role: "value",
    type: "number",
    unit: "h",
    dataSource: "value"
  },
  hours_heating: {
    folder: "Informationen.05_Betriebsstunden",
    name: "Betriebsstunden Heizbetrieb",
    role: "value",
    type: "number",
    unit: "h",
    dataSource: "value"
  },
  hours_warmwater: {
    folder: "Informationen.05_Betriebsstunden",
    name: "Betriebsstunden Warmwassererzeugung",
    role: "value",
    type: "number",
    unit: "h",
    dataSource: "value"
  },
  // Fehlerspeicher
  Fehlerspeicher: {
    folder: "Informationen.06_Fehlerspeicher",
    name: "Fehlerhistorie (Die letzten 5 Fehler)",
    role: "string",
    type: "json",
    isVirtual: true
  },
  // Abschaltungen
  Abschaltungen: {
    folder: "Informationen.07_Abschaltungen",
    name: "Abschalthistorie (Die letzten 5 Abschaltungen)",
    role: "string",
    type: "json",
    isVirtual: true
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
      7: "K\xFChlung"
    },
    dataSource: "value"
  },
  heatpump_extendet_state_string: {
    folder: "Informationen.08_Betriebszustand",
    name: "Erweiterter Status Text",
    role: "text",
    type: "string",
    dataSource: "value"
  },
  opStateHeating: {
    folder: "Informationen.08_Betriebszustand",
    name: "Betriebszustand Heizung",
    role: "value",
    type: "number",
    states: { 0: "Abgesenkt", 1: "Normal", 2: "Heizgrenze", 3: "Aus", 4: "Frostschutz" },
    dataSource: "value"
  },
  opStateHotWater: {
    folder: "Informationen.08_Betriebszustand",
    name: "Betriebszustand Warmwasser",
    role: "value",
    type: "number",
    states: { 0: "Aufheizen", 1: "Temp. OK", 2: "Aus", 3: "Sperrzeit" },
    dataSource: "value"
  },
  bivalentLevel: {
    folder: "Informationen.08_Betriebszustand",
    name: "Bivalenzstufe",
    role: "value",
    type: "number",
    states: {
      1: "Ein Verdichter darf laufen",
      2: "Zwei Verdichter d\xFCrfen laufen",
      3: "Zus\xE4tzlicher W\xE4rmeerzeuger darf mitlaufen"
    },
    dataSource: "value"
  },
  heatpump_duration: {
    folder: "Informationen.08_Betriebszustand",
    name: "Dauer aktueller Zustand",
    role: "value",
    type: "number",
    unit: "s",
    dataSource: "value"
  },
  heatpump_state_string: {
    folder: "Informationen.08_Betriebszustand",
    name: "W\xE4rmepumpen Status Text",
    role: "text",
    type: "string",
    dataSource: "value"
  },
  // Wärmemenge
  thermalenergy_heating: {
    folder: "Informationen.09_W\xE4rmemenge",
    name: "W\xE4rmemenge Heizung Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh",
    dataSource: "value"
  },
  thermalenergy_warmwater: {
    folder: "Informationen.09_W\xE4rmemenge",
    name: "W\xE4rmemenge Warmwasser Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh",
    dataSource: "value"
  },
  thermalenergy_total: {
    folder: "Informationen.09_W\xE4rmemenge",
    name: "W\xE4rmemenge Gesamt Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh",
    dataSource: "value"
  },
  // Energie
  // Energie
  energy_heating: {
    folder: "Informationen.10_Engergie",
    name: "Energie Heizung Erzeugt",
    role: "value.power.consumption",
    luxWriteId: "1136",
    type: "number",
    unit: "kWh",
    dataSource: "raw_parameter",
    // <--- HIER DER WECHSEL ZU 3003!
    factor: 10
  },
  energy_warmwater: {
    folder: "Informationen.10_Engergie",
    name: "Energie Warmwasser Erzeugt",
    role: "value.power.consumption",
    type: "number",
    luxWriteId: "1137",
    unit: "kWh",
    dataSource: "raw_parameter",
    // <--- HIER DER WECHSEL ZU 3003!
    factor: 10
  },
  energy_total: {
    folder: "Informationen.10_Engergie",
    name: "Energie Gesamt Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh",
    isVirtual: true
    // <--- KORREKTUR: Fehlte! Wird vom Adapter selbst addiert.
  },
  // ==========================================
  // EINSTELLUNGEN & PARAMETER (Beschreibbar)
  // ==========================================
  heating_curve_end_point: {
    folder: "Einstellungen.Heizung",
    name: "Heizkurve Endpunkt (R\xFCcklauf)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: 20,
    max: 45,
    dataSource: "parameter"
  },
  heating_curve_parallel_offset: {
    folder: "Einstellungen.Heizung",
    name: "Heizkurve Fusspunkt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: 20,
    max: 45,
    dataSource: "parameter"
  },
  deltaHeatingReduction: {
    folder: "Einstellungen.Heizung",
    name: "Heizung Nachtabsenkung (Delta)",
    role: "value.temperature",
    type: "number",
    unit: "K",
    write: true,
    factor: 10,
    min: -10,
    max: 10,
    dataSource: "parameter"
  },
  heating_temperature: {
    folder: "Einstellungen.Heizung",
    name: "Heizung Verschiebng Soll-Temperatur (Wunschwert)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "heating_target_temperature",
    min: -5,
    max: 5,
    dataSource: "parameter"
  },
  returnTemperatureHysteresis: {
    folder: "Einstellungen.Heizung",
    name: "R\xFCcklauftemperatur Hysterese",
    role: "value.temperature",
    type: "number",
    unit: "K",
    write: true,
    factor: 1,
    min: 1,
    max: 5,
    dataSource: "parameter"
  },
  warmwater_temperature: {
    folder: "Einstellungen.Warmwasser",
    name: "Warmwasser Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "temperature_hot_water_target",
    min: 30,
    max: 65,
    dataSource: "parameter"
  },
  hotWaterTemperatureHysteresis: {
    folder: "Einstellungen.Warmwasser",
    name: "Warmwasser Hysterese",
    role: "value.temperature",
    type: "number",
    unit: "K",
    write: true,
    factor: 1,
    min: 1,
    max: 15,
    dataSource: "parameter"
  },
  heating_operation_mode: {
    folder: "Einstellungen.Betriebsmodus",
    name: "Betriebsart Heizung",
    role: "level.mode",
    type: "number",
    write: true,
    states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" },
    dataSource: "parameter"
  },
  warmwater_operation_mode: {
    folder: "Einstellungen.Betriebsmodus",
    name: "Betriebsart Warmwasser",
    role: "level.mode",
    type: "number",
    write: true,
    states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" },
    dataSource: "parameter"
  },
  heating_system_circ_pump_voltage_nominal: {
    folder: "Einstellungen.Pumpen",
    name: "Heizungsumw\xE4lzpumpe Nennspannung",
    role: "value.voltage",
    type: "number",
    unit: "V",
    write: true,
    factor: 1,
    min: 3,
    max: 10,
    dataSource: "parameter"
  },
  heating_system_circ_pump_voltage_minimal: {
    folder: "Einstellungen.Pumpen",
    name: "Heizungsumw\xE4lzpumpe Minimalspannung",
    role: "value.voltage",
    type: "number",
    unit: "V",
    write: true,
    factor: 1,
    min: 3,
    max: 10,
    dataSource: "parameter"
  },
  runDeaerate: {
    folder: "Einstellungen.Spezial",
    name: "Entl\xFCftungsprogramm starten",
    role: "indicator",
    type: "boolean",
    write: true,
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "parameter"
  },
  hotWaterCircPumpDeaerate: {
    folder: "Einstellungen.Spezial",
    name: "Zirkulationspumpe entl\xFCften",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    write: true,
    dataSource: "parameter"
  },
  solarPumpDeaerate: {
    folder: "Einstellungen.Spezial",
    name: "Solarpumpe entl\xFCften",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    write: true,
    dataSource: "parameter"
  },
  Activate_Zip: {
    folder: "Einstellungen.Spezial",
    name: "Makro: ZIP Entl\xFCftung starten",
    role: "value",
    type: "number",
    write: true,
    states: { 0: "Aus", 1: "Ein" },
    luxWriteId: "Activate_Zip",
    isVirtual: true
  },
  thresholdHeatingLimit: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 700 (ID_Einst_Heizgrenze_Temp)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "700",
    unit: "\xB0C",
    factor: 10,
    dataSource: "parameter"
  },
  heatingLimit: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 699 (ID_Einst_Heizgrenze)",
    write: true,
    role: "value",
    type: "number",
    luxWriteId: "699",
    states: { 0: "Aus", 1: "Ein" },
    dataSource: "parameter"
  },
  727: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 727 (ID_Laufvar_Heizgrenze)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "727",
    unit: "\xB0C",
    dataSource: "parameter"
  },
  43: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 43 (ID_Einst_ABTLuft_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "43",
    unit: "\xB0C",
    dataSource: "raw_parameter"
  },
  44: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 44 (ID_Einst_ABTLuft_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "44",
    unit: "\xB0C",
    dataSource: "raw_parameter"
  },
  45: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 45 (ID_Einst_LAbtTime_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "45",
    unit: "\xB0C",
    dataSource: "raw_parameter"
  },
  697: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 697 (ID_Einst_Zirk_Ein_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "697",
    unit: "\xB0C",
    dataSource: "parameter"
  },
  698: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 698 (ID_Einst_Zirk_Aus_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "698",
    unit: "\xB0C",
    dataSource: "parameter"
  },
  869: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 869 (ID_Einst_Effizienzpumpe_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "869",
    unit: "\xB0C",
    dataSource: "parameter"
  },
  // Systeminfo
  typeHeatpump: {
    folder: "Informationen.Systeminfo",
    name: "W\xE4rmepumpen-Typ",
    role: "text",
    type: "string",
    dataSource: "additional"
  },
  firmware: {
    folder: "Informationen.Systeminfo",
    name: "Firmware-Version",
    role: "text",
    type: "string",
    dataSource: "additional"
  },
  AdresseIP_akt: {
    folder: "Informationen.Systeminfo",
    name: "Aktuelle IP-Adresse",
    role: "info.ip",
    type: "string",
    dataSource: "additional"
  },
  SubNetMask_akt: {
    folder: "Informationen.Systeminfo",
    name: "Subnetzmaske",
    role: "info.ip",
    type: "string",
    dataSource: "additional"
  },
  Add_Broadcast: {
    folder: "Informationen.Systeminfo",
    name: "Broadcast-Adresse",
    role: "info.ip",
    type: "string",
    dataSource: "additional"
  },
  Add_StdGateway: {
    folder: "Informationen.Systeminfo",
    name: "Standard-Gateway",
    role: "info.ip",
    type: "string",
    dataSource: "additional"
  },
  Comfort_exists: {
    folder: "Informationen.Systeminfo",
    name: "Comfort-Platine vorhanden",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  Compact_exists: {
    folder: "Informationen.Systeminfo",
    name: "Compact-Bauform vorhanden",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  LIN_exists: {
    folder: "Informationen.Systeminfo",
    name: "LIN-Bus vorhanden",
    role: "indicator",
    type: "boolean",
    dataSource: "value"
  },
  rawDeviceTimeCalc: {
    folder: "Informationen.Systeminfo",
    name: "Berechnete Ger\xE4tezeit",
    role: "date",
    type: "string",
    dataSource: "value"
  },
  // Status
  status_heating: {
    folder: "Informationen.Status",
    name: "Status Heizbetrieb",
    role: "indicator",
    type: "boolean",
    dataSource: "value"
  },
  Einst_Kurzprogramm: {
    folder: "Informationen.Status",
    name: "Einstellung Kurzprogramm",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  StatusSlave_1: {
    folder: "Informationen.Status",
    name: "Status Slave 1",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  StatusSlave_2: {
    folder: "Informationen.Status",
    name: "Status Slave 2",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  StatusSlave_3: {
    folder: "Informationen.Status",
    name: "Status Slave 3",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  StatusSlave_4: {
    folder: "Informationen.Status",
    name: "Status Slave 4",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  StatusSlave_5: {
    folder: "Informationen.Status",
    name: "Status Slave 5",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  SonderZeichen: {
    folder: "Informationen.Status",
    name: "Sonderzeichen Code",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  SH_ZIP: {
    folder: "Informationen.Status",
    name: "Status SH_ZIP",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  WebsrvProgrammWerteBeobarten: {
    folder: "Informationen.Status",
    name: "Webserver Programmwerte Beobachten",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  Durchfluss_WQ: {
    folder: "Informationen.Status",
    name: "Durchfluss W\xE4rmequelle",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  flowRate: {
    folder: "Informationen.Status",
    name: "Durchflussmenge",
    role: "value",
    type: "number",
    dataSource: "value"
  },
  LIN_TUE: {
    folder: "Informationen.Status",
    name: "LIN-Bus Verdampfer-Ansaug (TUE)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    factor: 10,
    dataSource: "value"
  },
  LIN_HD: {
    folder: "Informationen.Status",
    name: "LIN-Bus Hochdruck",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 100,
    dataSource: "value"
  },
  LIN_ND: {
    folder: "Informationen.Status",
    name: "LIN-Bus Niederdruck",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 100,
    dataSource: "value"
  },
  LIN_VDH_out: {
    folder: "Informationen.Status",
    name: "LIN-Bus Verdichterkopfheizung Ansteuerung",
    role: "value",
    type: "number",
    unit: "%",
    dataSource: "value"
  }
};
for (const key of Object.keys(STATE_MAPPING)) {
  if (!STATE_MAPPING[key].luxWriteId) {
    STATE_MAPPING[key].luxWriteId = key;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  STATE_MAPPING
});
//# sourceMappingURL=stateMapping.js.map

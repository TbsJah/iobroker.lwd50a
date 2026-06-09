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
    unit: "\xB0C"
  },
  temperature_return: {
    folder: "Informationen.01_Temperaturen",
    name: "R\xFCcklauftemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_target_return: {
    folder: "Informationen.01_Temperaturen",
    name: "R\xFCckl.-Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_hot_gas: {
    folder: "Informationen.01_Temperaturen",
    name: "Heissgas-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_outside: {
    folder: "Informationen.01_Temperaturen",
    name: "Au\xDFentemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  Mitteltemperatur: {
    folder: "Informationen.01_Temperaturen",
    name: "Value 16 (ID_WEB_Mitteltemperatur)",
    role: "value",
    type: "number",
    write: false,
    luxWriteId: "16",
    unit: "\xB0C",
    factor: 10
  },
  temperature_hot_water: {
    folder: "Informationen.01_Temperaturen",
    name: "Warmwassertemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  Wamwassertemperatur_Ist: {
    folder: "Informationen.01_Temperaturen",
    name: "Value 17 (ID_WEB_Temperatur_TBW)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: false,
    luxWriteId: "17",
    factor: 10
  },
  Wamwassertemperatur_Soll: {
    folder: "Informationen.01_Temperaturen",
    name: "Value 18 (ID_WEB_Einst_BWS_akt)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: false,
    luxWriteId: "18",
    factor: 10
  },
  temperature_heat_source_in: {
    folder: "Informationen.01_Temperaturen",
    name: "W\xE4rmequelle Eintritt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  LIN_TUE1: {
    folder: "Informationen.01_Temperaturen",
    name: "LIN-Bus Ansaug VD",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  LIN_VDH: {
    folder: "Informationen.01_Temperaturen",
    name: "LIN-Bus Hei\xDFgastemperatur Verdichter (VDH)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    factor: 1
  },
  LIN_UH: {
    folder: "Informationen.01_Temperaturen",
    name: "LIN-Bus \xDCberhitzung Ist (UH)",
    role: "value.temperature",
    type: "number",
    unit: "K",
    factor: 1
  },
  LIN_UH_Soll: {
    folder: "Informationen.01_Temperaturen",
    name: "LIN-Bus \xDCberhitzung Soll",
    role: "value.temperature",
    type: "number",
    unit: "K",
    factor: 1
  },
  // Eingänge
  ASDin: {
    folder: "Informationen.02_Eingaenge",
    name: "Abtau-Endeschalter ASD",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  EVUin: {
    folder: "Informationen.02_Eingaenge",
    name: "EVU-Sperre",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  HDin: {
    folder: "Informationen.02_Eingaenge",
    name: "Hochdruckw\xE4chter HD",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  MOTin: {
    folder: "Informationen.02_Eingaenge",
    name: "Motorschutz MOT",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  NDin: {
    folder: "Informationen.02_Eingaenge",
    name: "Niederdruckw\xE4chter ND",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  AnalogIn: {
    folder: "Informationen.02_Eingaenge",
    name: "Analoger Eingang 1",
    role: "value",
    type: "number",
    unit: "V"
  },
  NDin_pressure: {
    folder: "Informationen.02_Eingaenge",
    name: "Niederdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 1
  },
  HDin_pressure: {
    folder: "Informationen.02_Eingaenge",
    name: "Hochdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 1
  },
  BWTin: {
    folder: "Informationen.02_Eingaenge",
    name: "Brauchwasserthermostat BWT",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  // Ausgänge
  AVout: {
    folder: "Informationen.Ausgaenge",
    name: "Abtauventil AV",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  BUPout: {
    folder: "Informationen.Ausgaenge",
    name: "Warmwasser-Umw\xE4lzpumpe BUP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  HUPout: {
    folder: "Informationen.Ausgaenge",
    name: "Heizungsumw\xE4lzpumpe HUP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  VENout: {
    folder: "Informationen.Ausgaenge",
    name: "Ventilator VEN",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  VD1out: {
    folder: "Informationen.Ausgaenge",
    name: "Verdichter 1 VD1",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  ZIPout: {
    folder: "Informationen.Ausgaenge",
    name: "Zirkulationspumpe ZIP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  ZUPout: {
    folder: "Informationen.Ausgaenge",
    name: "Zusatzumw\xE4lzpumpe ZUP",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  ZW1out: {
    folder: "Informationen.Ausgaenge",
    name: "Zweiter W\xE4rmeerzeuger 1 ZW1",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  analogOut1: {
    folder: "Informationen.Ausgaenge",
    name: "Analoger Ausgang 1",
    role: "value",
    type: "number",
    unit: "V"
  },
  analogOut2: {
    folder: "Informationen.Ausgaenge",
    name: "Analoger Ausgang 2",
    role: "value",
    type: "number",
    unit: "V"
  },
  defrostValve: {
    folder: "Informationen.Ausgaenge",
    name: "Status Abtauventil",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  hotWaterBoilerValve: {
    folder: "Informationen.Ausgaenge",
    name: "Status Umschaltventil Warmwasser",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  heatingSystemCircPump: {
    folder: "Informationen.Ausgaenge",
    name: "Heizungssystem Zirkulationspumpe Laufindikator",
    role: "indicator",
    type: "boolean"
  },
  heatSourceMotor: {
    folder: "Informationen.Ausgaenge",
    name: "Motor W\xE4rmequelle",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  compressor1: {
    folder: "Informationen.Ausgaenge",
    name: "Status Kompressor 1 Laufr\xFCckmeldung",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  hotWaterCircPumpExtern: {
    folder: "Informationen.Ausgaenge",
    name: "Warmwasser Zirkulationspumpe Extern",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" }
  },
  //Zeiten
  Time_WPein_akt: {
    folder: "Informationen.03_Timer",
    name: "Aktuelle Einschaltzeit W\xE4rmepumpe",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_ZWE1_akt: {
    folder: "Informationen.03_Timer",
    name: "Aktuelle Laufzeit ZWE1",
    role: "value",
    type: "number",
    unit: "s"
  },
  Timer_EinschVerz: {
    folder: "Informationen.03_Timer",
    name: "Einschaltverz\xF6gerung Restzeit",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SSPAUS_akt: {
    folder: "Informationen.03_Timer",
    name: "Aktuelle Sperrzeit AUS",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SSPEIN_akt: {
    folder: "Informationen.03_Timer",
    name: "Aktuelle Sperrzeit EIN",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_VDStd_akt: {
    folder: "Informationen.03_Timer",
    name: "Aktuelle Standzeit Verdichter",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_HRM_akt: {
    folder: "Informationen.03_Timer",
    name: "Aktuelle Zeit HRM",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_HRW_akt: {
    folder: "Informationen.03_Timer",
    name: "Aktuelle Zeit HRW",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_Heissgas: {
    folder: "Informationen.03_Timer",
    name: "Zeit Hei\xDFgas\xFCberwachung",
    role: "value",
    type: "number",
    unit: "s"
  },
  ahp_Zeit: {
    folder: "Informationen.03_Timer",
    name: "Zeit ahp-Stufe",
    role: "value",
    type: "number",
    unit: "s"
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
    max: 45
  },
  heating_curve_parallel_offset: {
    folder: "Einstellungen.Heizung",
    name: "Heizkurve Fusspunkt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: 20,
    max: 45
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
    max: 10
  },
  heating_temperature: {
    folder: "Einstellungen.Heizung",
    name: "Heizung Verschiebng Soll-Temperatur (Wunschwert)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "heating_target_temperature",
    // Weicht ab, bleibt explizit stehen
    min: -5,
    max: 5
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
    max: 5
  },
  warmwater_temperature: {
    folder: "Einstellungen.Warmwasser",
    name: "Warmwasser Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "temperature_hot_water_target",
    // Weicht ab, bleibt explizit stehen
    min: 30,
    max: 65
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
    max: 15
  },
  mk1_curve_end_point: {
    folder: "Einstellungen.Mischkreis1",
    name: "MK1 Heizkurve Endpunkt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    factor: 1,
    min: 20,
    max: 50
  },
  mk1_curve_parallel_offset: {
    folder: "Einstellungen.Mischkreis1",
    name: "MK1 Heizkurve Parallelverschiebung",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    factor: 1,
    min: 20,
    max: 50
  },
  deltaMk1Reduction: {
    folder: "Einstellungen.Mischkreis1",
    name: "MK1 Nachtabsenkung (Delta)",
    role: "value.temperature",
    type: "number",
    unit: "K",
    write: true,
    factor: 10,
    min: -10,
    max: 10
  },
  mk2_curve_end_point: {
    folder: "Einstellungen.Mischkreis2",
    name: "MK2 Heizkurve Endpunkt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: 20,
    max: 50
  },
  mk2_curve_parallel_offset: {
    folder: "Einstellungen.Mischkreis2",
    name: "MK2 Heizkurve Parallelverschiebung",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    factor: 1,
    min: -5,
    max: 5
  },
  deltaMk2Reduction: {
    folder: "Einstellungen.Mischkreis2",
    name: "MK2 Nachtabsenkung (Delta)",
    role: "value.temperature",
    type: "number",
    unit: "K",
    write: true,
    factor: 10,
    min: -10,
    max: 10
  },
  mk3_curve_end_point: {
    folder: "Einstellungen.Mischkreis3",
    name: "MK3 Heizkurve Endpunkt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: 20,
    max: 50
  },
  mk3_curve_parallel_offset: {
    folder: "Einstellungen.Mischkreis3",
    name: "MK3 Heizkurve Parallelverschiebung",
    role: "value.temperature",
    type: "number",
    unit: "K",
    write: true,
    factor: 10,
    min: -5,
    max: 5
  },
  deltaMk3Reduction: {
    folder: "Einstellungen.Mischkreis3",
    name: "MK3 Nachtabsenkung (Delta)",
    role: "value.temperature",
    type: "number",
    unit: "K",
    write: true,
    factor: 10,
    min: -10,
    max: 10
  },
  heating_operation_mode: {
    folder: "Einstellungen.Betriebsmodus",
    name: "Betriebsart Heizung",
    role: "level.mode",
    type: "number",
    write: true,
    states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" }
  },
  warmwater_operation_mode: {
    folder: "Einstellungen.Betriebsmodus",
    name: "Betriebsart Warmwasser",
    role: "level.mode",
    type: "number",
    write: true,
    states: { 0: "Automatik", 1: "Zweites WEZ", 2: "Party", 3: "Ferien", 4: "Aus" }
  },
  cooling_operation_mode: {
    folder: "Einstellungen.Betriebsmodus",
    name: "Betriebsart K\xFChlung",
    role: "level.mode",
    type: "number",
    write: true,
    states: { 0: "Aus", 1: "Automatik" }
  },
  cooling_release_temperature: {
    folder: "Einstellungen.Kuehlung",
    name: "K\xFChlung Freigabe-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "cooling_release_temp",
    min: 15,
    max: 30
  },
  cooling_inlet_temp: {
    folder: "Einstellungen.Kuehlung",
    name: "K\xFChlung Vorlauf-Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: 15,
    max: 25
  },
  cooling_start_after_hours: {
    folder: "Einstellungen.Kuehlung",
    name: "K\xFChlung Start-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "cooling_start"
  },
  cooling_stop_after_hours: {
    folder: "Einstellungen.Kuehlung",
    name: "K\xFChlung Stopp-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "cooling_stop"
  },
  heating_temperature_outside_2nd_compressor: {
    folder: "Einstellungen.Verdichter",
    name: "Freigabe 2. Verdichter (Au\xDFentemperatur)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: -20,
    max: 10
  },
  hotwater_temperature_forerun_2nd_compressor: {
    folder: "Einstellungen.Verdichter",
    name: "Freigabe 2. Verdichter (Warmwasser-Vorlauf)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    min: 10,
    max: 60
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
    max: 10
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
    max: 10
  },
  runDeaerate: {
    folder: "Einstellungen.Spezial",
    name: "Entl\xFCftungsprogramm starten",
    role: "indicator",
    type: "boolean",
    write: true,
    states: { 0: "Aus", 1: "Ein" }
  },
  hotWaterCircPumpDeaerate: {
    folder: "Einstellungen.Spezial",
    name: "Zirkulationspumpe entl\xFCften",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    write: true
  },
  solarPumpDeaerate: {
    folder: "Einstellungen.Spezial",
    name: "Solarpumpe entl\xFCften",
    role: "value",
    type: "number",
    states: { 0: "Aus", 1: "Ein" },
    write: true
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
    factor: 10
  },
  heatingLimit: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 699 (ID_Einst_Heizgrenze)",
    write: true,
    role: "value",
    type: "number",
    luxWriteId: "699",
    states: { 0: "Aus", 1: "Ein" }
  },
  727: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 727 (ID_Laufvar_Heizgrenze)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "727",
    unit: "\xB0C"
  },
  43: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 43 (ID_Einst_ABTLuft_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "43",
    unit: "\xB0C"
  },
  44: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 44 (ID_Einst_ABTLuft_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "44",
    unit: "\xB0C"
  },
  45: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 45 (ID_Einst_LAbtTime_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "45",
    unit: "\xB0C"
  },
  697: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 697 (ID_Einst_Zirk_Ein_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "697",
    unit: "\xB0C"
  },
  698: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 698 (ID_Einst_Zirk_Aus_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "698",
    unit: "\xB0C"
  },
  869: {
    folder: "Einstellungen.System-Einstellung",
    name: "Parameter 869 (ID_Einst_Effizienzpumpe_akt)",
    role: "value",
    type: "number",
    write: true,
    luxWriteId: "869",
    unit: "\xB0C"
  },
  temperature_overheating_target: {
    folder: "Informationen.Kaeltekreis",
    name: "\xDCberhitzung Soll",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_compressor1_heating: {
    folder: "Informationen.Kaeltekreis",
    name: "Hei\xDFgas Kompressor 1",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_overheating: {
    folder: "Informationen.Kaeltekreis",
    name: "\xDCberhitzung Ist",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_intake_compressor1: {
    folder: "Informationen.Kaeltekreis",
    name: "Saugstatus Kompressor 1 Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_intake_evaporation: {
    folder: "Informationen.Kaeltekreis",
    name: "Saugstatus Verdampfer Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  thermalenergy_heating: {
    folder: "Informationen.Statistik",
    name: "W\xE4rmemenge Heizung Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  thermalenergy_warmwater: {
    folder: "Informationen.Statistik",
    name: "W\xE4rmemenge Warmwasser Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  thermalenergy_pool: {
    folder: "Informationen.Statistik",
    name: "W\xE4rmemenge Schwimmbad Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  thermalenergy_total: {
    folder: "Informationen.Statistik",
    name: "W\xE4rmemenge Gesamt Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  thermalenergyTotal: {
    folder: "Informationen.Statistik",
    name: "W\xE4rmemenge Gesamt Erzeugt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh",
    write: false,
    luxWriteId: "thermalenergy_total",
    factor: 10
  },
  typeHeatpump: { folder: "Informationen.Systeminfo", name: "W\xE4rmepumpen-Typ", role: "text", type: "string" },
  firmware: { folder: "Informationen.Systeminfo", name: "Firmware-Version", role: "text", type: "string" },
  AdresseIP_akt: { folder: "Informationen.Systeminfo", name: "Aktuelle IP-Adresse", role: "info.ip", type: "string" },
  SubNetMask_akt: { folder: "Informationen.Systeminfo", name: "Subnetzmaske", role: "info.ip", type: "string" },
  Add_Broadcast: { folder: "Informationen.Systeminfo", name: "Broadcast-Adresse", role: "info.ip", type: "string" },
  Add_StdGateway: { folder: "Informationen.Systeminfo", name: "Standard-Gateway", role: "info.ip", type: "string" },
  Comfort_exists: {
    folder: "Informationen.Systeminfo",
    name: "Comfort-Platine vorhanden",
    role: "value",
    type: "number"
  },
  Compact_exists: {
    folder: "Informationen.Systeminfo",
    name: "Compact-Bauform vorhanden",
    role: "value",
    type: "number"
  },
  LIN_exists: { folder: "Informationen.Systeminfo", name: "LIN-Bus vorhanden", role: "indicator", type: "boolean" },
  rawDeviceTimeCalc: {
    folder: "Informationen.Systeminfo",
    name: "Berechnete Ger\xE4tezeit",
    role: "date",
    type: "string"
  },
  status_heating: { folder: "Informationen.Status", name: "Status Heizbetrieb", role: "indicator", type: "boolean" },
  bivalentLevel: {
    folder: "Informationen.Status",
    name: "Bivalenzstufe",
    role: "value",
    type: "number",
    states: {
      1: "Ein Verdichter darf laufen",
      2: "Zwei Verdichter d\xFCrfen laufen",
      3: "Zus\xE4tzlicher W\xE4rmeerzeuger darf mitlaufen"
    }
  },
  WP_BZ_akt: {
    folder: "Informationen.Betriebszustand",
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
    }
  },
  heatpump_state1: {
    folder: "Informationen.Status",
    name: "W\xE4rmepumpen Status-Code 1",
    role: "value",
    type: "number"
  },
  heatpump_state2: {
    folder: "Informationen.Status",
    name: "W\xE4rmepumpen Status-Code 2",
    role: "value",
    type: "number"
  },
  heatpump_state3: {
    folder: "Informationen.Status",
    name: "W\xE4rmepumpen Status-Code 3",
    role: "value",
    type: "number"
  },
  heatpump_duration: {
    folder: "Informationen.Status",
    name: "Dauer aktueller Zustand",
    role: "value",
    type: "number",
    unit: "s"
  },
  heatpump_state_string: {
    folder: "Informationen.Status",
    name: "W\xE4rmepumpen Status Text",
    role: "text",
    type: "string"
  },
  heatpump_extendet_state_string: {
    folder: "Informationen.Status",
    name: "Erweiterter Status Text",
    role: "text",
    type: "string"
  },
  ahp_Stufe: { folder: "Informationen.Status", name: "Aktuelle ahp-Stufe", role: "value", type: "number" },
  ahp_Temp: {
    folder: "Informationen.Status",
    name: "Temperatur ahp-Stufe",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  opStateHotWater: {
    folder: "Informationen.Status",
    name: "Betriebszustand Warmwasser Code",
    role: "value",
    type: "number"
  },
  opStateMixer1: {
    folder: "Informationen.Status",
    name: "Betriebszustand Mischerkreis 1",
    role: "value",
    type: "number"
  },
  opStateMixer2: {
    folder: "Informationen.Status",
    name: "Betriebszustand Mischerkreis 2",
    role: "value",
    type: "number"
  },
  opStateMixer3: {
    folder: "Informationen.Status",
    name: "Betriebszustand Mischerkreis 3",
    role: "value",
    type: "number"
  },
  Einst_Kurzprogramm: {
    folder: "Informationen.Status",
    name: "Einstellung Kurzprogramm",
    role: "value",
    type: "number"
  },
  StatusSlave_1: { folder: "Informationen.Status", name: "Status Slave 1", role: "value", type: "number" },
  StatusSlave_2: { folder: "Informationen.Status", name: "Status Slave 2", role: "value", type: "number" },
  StatusSlave_3: { folder: "Informationen.Status", name: "Status Slave 3", role: "value", type: "number" },
  StatusSlave_4: { folder: "Informationen.Status", name: "Status Slave 4", role: "value", type: "number" },
  StatusSlave_5: { folder: "Informationen.Status", name: "Status Slave 5", role: "value", type: "number" },
  SH_SW: { folder: "Informationen.Status", name: "Status SH_SW", role: "value", type: "number" },
  FreigabKuehl: { folder: "Informationen.Status", name: "Freigabe K\xFChlung", role: "value", type: "number" },
  SonderZeichen: { folder: "Informationen.Status", name: "Sonderzeichen Code", role: "value", type: "number" },
  SH_ZIP: { folder: "Informationen.Status", name: "Status SH_ZIP", role: "value", type: "number" },
  WebsrvProgrammWerteBeobarten: {
    folder: "Informationen.Status",
    name: "Webserver Programmwerte Beobachten",
    role: "value",
    type: "number"
  },
  Durchfluss_WQ: { folder: "Informationen.Status", name: "Durchfluss W\xE4rmequelle", role: "value", type: "number" },
  flowRate: { folder: "Informationen.Status", name: "Durchflussmenge", role: "value", type: "number" },
  LIN_TUE: {
    folder: "Informationen.Status",
    name: "LIN-Bus Verdampfer-Ansaug (TUE)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    factor: 10
  },
  LIN_HD: {
    folder: "Informationen.Status",
    name: "LIN-Bus Hochdruck",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 100
  },
  LIN_ND: {
    folder: "Informationen.Status",
    name: "LIN-Bus Niederdruck",
    role: "value.pressure",
    type: "number",
    unit: "bar",
    factor: 100
  },
  LIN_VDH_out: {
    folder: "Informationen.Status",
    name: "LIN-Bus Verdichterkopfheizung Ansteuerung",
    role: "value",
    type: "number",
    unit: "%"
  },
  opStateHotWaterString: {
    folder: "Informationen.Warmwasser",
    name: "Status Warmwasser Text",
    role: "text",
    type: "string"
  },
  opStateHotWaterS: {
    folder: "Informationen.Warmwasser",
    name: "Status Warmwasser",
    role: "value",
    type: "number"
  },
  opStateHeating: {
    folder: "Informationen.Heizung",
    name: "Betriebszustand Heizung Code",
    role: "value",
    type: "number",
    states: { 0: "Abgesenkt", 1: "Normal", 2: "Aus" }
  },
  opStateHeatingString: {
    folder: "Informationen.Heizung",
    name: "Betriebszustand Heizung Text",
    role: "text",
    type: "string"
  },
  hours_compressor1: {
    folder: "Informationen.Betriebsstunden",
    name: "Betriebsstunden Kompressor 1",
    role: "value",
    type: "number",
    unit: "h"
  },
  starts_compressor1: {
    folder: "Informationen.Betriebsstunden",
    name: "Schaltspiele Kompressor 1",
    role: "value",
    type: "number"
  },
  hours_2nd_heat_source1: {
    folder: "Informationen.Betriebsstunden",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 1 (Heizstab)",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_heatpump: {
    folder: "Informationen.Betriebsstunden",
    name: "Betriebsstunden W\xE4rmepumpe Gesamt",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_heating: {
    folder: "Informationen.Betriebsstunden",
    name: "Betriebsstunden Heizbetrieb",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_warmwater: {
    folder: "Informationen.Betriebsstunden",
    name: "Betriebsstunden Warmwassererzeugung",
    role: "value",
    type: "number",
    unit: "h"
  },
  Betriebsstunden_Gesamt: {
    folder: "Informationen.Betriebsstunden",
    name: "Betriebsstunden Gesamt (Berechnet: Heizung + WW)",
    role: "value",
    type: "number",
    unit: "h",
    write: false,
    isVirtual: true
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

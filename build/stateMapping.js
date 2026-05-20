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
  //Einstellungen.Betriebsart
  heating_operation_mode: {
    folder: "Einstellungen.Betriebsart",
    name: "Betriebsart Heizung",
    role: "value",
    // "level.mode" passt perfekt für Dropdowns
    type: "number",
    write: true,
    LuxID: "heating_operation_mode",
    states: {
      0: "Automatik",
      1: "Zusatzheizung",
      2: "Party",
      3: "Ferien",
      4: "Aus"
    }
  },
  warmwater_operation_mode: {
    folder: "Einstellungen.Betriebsart",
    name: "Betriebsart Warmwasser",
    role: "value",
    // "level.mode" passt perfekt für Dropdowns
    type: "number",
    write: true,
    LuxID: "warmwater_operation_mode",
    states: {
      0: "Automatik",
      1: "Zusatzheizung",
      2: "Party",
      3: "Ferien",
      4: "Aus"
    }
  },
  //Einstellungen.Temperaturen
  heating_curve_end_point: {
    folder: "Einstellungen.Temperaturen",
    name: "Heizkurve Endpunkt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    LuxID: "heating_curve_end_point",
    min: 20,
    max: 35
  },
  heating_curve_parallel_offset: {
    folder: "Einstellungen.Temperaturen",
    name: "Heizkurve Parallel-Offset",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    LuxID: "heating_curve_parallel_offset",
    min: 20,
    max: 35
  },
  warmwater_temperature: {
    folder: "Parameter",
    name: "Warmwasser Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    LuxID: "temperature_hot_water_target",
    min: 40,
    max: 65
  },
  //Informationen.Betriebsmodus
  heating_operation_mode_string: {
    folder: "Informationen.Betriebsmodus",
    name: "Betriebsart Heizung",
    role: "text",
    type: "string"
  },
  warmwater_operation_mode_string: {
    folder: "Informationen.Betriebsmodus",
    name: "Betriebsart Warmwasser",
    role: "text",
    type: "string"
  },
  //Informationen.Status
  heatpump_state_string: {
    folder: "Informationen.Status",
    name: "Status Text",
    role: "text",
    type: "string"
  },
  heatpump_extendet_state_string: {
    folder: "Informationen.Status",
    name: "Status Text Erweitert",
    role: "text",
    type: "string"
  },
  //Informationen.Ablaufzeiten
  heatpump_time_to_target_string: {
    folder: "Informationen.Ablaufzeiten",
    name: "Zeit bis Zieltemperatur",
    role: "text",
    type: "string"
  },
  //Informationen.Temperaturen
  temperature_supply: {
    folder: "Informationen.Temperaturen",
    name: "Vorlauftemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_return: {
    folder: "Informationen.Temperaturen",
    name: "R\xFCcklauftemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_outside: {
    folder: "Informationen.Temperaturen",
    name: "Au\xDFentemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_hot_water_target: {
    folder: "Temperaturen",
    name: "Warmwasser Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_target_return: {
    folder: "Informationen.Temperaturen",
    name: "R\xFCckl.-Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_hot_gas: {
    folder: "Informationen.Temperaturen",
    name: "Heissgasttemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_outside_avg: {
    folder: "Informationen.Temperaturen",
    name: "Mitteltemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_hot_water: {
    folder: "Informationen.Temperaturen",
    name: "Warmwasser-Ist-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_heat_source_in: {
    folder: "Informationen.Temperaturen",
    name: "W\xE4rmequelle-Eingang-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  status_heating: {
    folder: "status",
    name: "Status Heizung",
    role: "indicator",
    type: "boolean"
  },
  hot_water_target: {
    folder: "parameters",
    name: "Warmwasser Soll-Temperatur",
    role: "level.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    LuxID: "hot_water_target",
    min: 30,
    max: 60
  },
  // --- NEUE WERTE: Kältekreis-Temperaturen ---
  temperature_overheating_target: {
    folder: "temperatures",
    name: "\xDCberhitzung Soll",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_compressor1_heating: {
    folder: "temperatures",
    name: "Hei\xDFgas Kompressor 1",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_overheating: {
    folder: "temperatures",
    name: "\xDCberhitzung Ist",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_intake_compressor1: {
    folder: "temperatures",
    name: "Saugstatus Kompressor 1",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_intake_evaporation: {
    folder: "temperatures",
    name: "Saugstatus Verdampfer",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  // --- NEUE WERTE: Digitale und Analoge Eingänge (Inputs) ---
  ASDin: {
    folder: "inputs",
    name: "Eingang Abtau-Endeschalter ASD",
    role: "value",
    type: "number"
  },
  BWTin: {
    folder: "inputs",
    name: "Eingang Brauchwassertthermostat BWT",
    role: "value",
    type: "number"
  },
  EVUin: {
    folder: "inputs",
    name: "Eingang EVU-Sperre",
    role: "value",
    type: "number"
  },
  HDin: {
    folder: "inputs",
    name: "Eingang Hochdruckw\xE4chter HD",
    role: "value",
    type: "number"
  },
  MOTin: {
    folder: "inputs",
    name: "Eingang Motorschutz MOT",
    role: "value",
    type: "number"
  },
  NDin: {
    folder: "inputs",
    name: "Eingang Niederdruckw\xE4chter ND",
    role: "value",
    type: "number"
  },
  NDin_pressure: {
    folder: "inputs",
    name: "Niederdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar"
  },
  HDin_pressure: {
    folder: "inputs",
    name: "Hochdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar"
  },
  PEXin: {
    folder: "inputs",
    name: "Eingang Externer Druckw\xE4chter PEX",
    role: "value",
    type: "number"
  },
  SWTin: {
    folder: "inputs",
    name: "Eingang Schwimmbadthermostat SWT",
    role: "value",
    type: "number"
  },
  AnalogIn: {
    folder: "inputs",
    name: "Analoger Eingang 1",
    role: "value",
    type: "number"
  },
  AnalogIn2: {
    folder: "inputs",
    name: "Analoger Eingang 2",
    role: "value",
    type: "number"
  },
  AnalogIn3: {
    folder: "inputs",
    name: "Analoger Eingang 3",
    role: "value",
    type: "number"
  },
  SAXin: {
    folder: "inputs",
    name: "Eingang SAX",
    role: "value",
    type: "number"
  },
  SPLin: {
    folder: "inputs",
    name: "Eingang SPL",
    role: "value",
    type: "number"
  },
  // --- NEUE WERTE: Ausgänge (Relais/Aktoren) ---
  AVout: {
    folder: "outputs",
    name: "Ausgang Abtauventil AV",
    role: "value",
    type: "number"
  },
  BUPout: {
    folder: "outputs",
    name: "Ausgang Warmwasser-Umw\xE4lzpumpe BUP",
    role: "value",
    type: "number"
  },
  HUPout: {
    folder: "outputs",
    name: "Ausgang Heizungsumw\xE4lzpumpe HUP",
    role: "value",
    type: "number"
  },
  MA1out: {
    folder: "outputs",
    name: "Ausgang Mischer 1 Auf MA1",
    role: "value",
    type: "number"
  },
  MZ1out: {
    folder: "outputs",
    name: "Ausgang Mischer 1 Zu MZ1",
    role: "value",
    type: "number"
  },
  VENout: {
    folder: "outputs",
    name: "Ausgang Ventilator VEN",
    role: "value",
    type: "number"
  },
  VBOout: {
    folder: "outputs",
    name: "Ausgang Ventilausgang Brunnen VBO",
    role: "value",
    type: "number"
  },
  VD1out: {
    folder: "outputs",
    name: "Ausgang Verdichter 1 VD1",
    role: "value",
    type: "number"
  },
  VD2out: {
    folder: "outputs",
    name: "Ausgang Verdichter 2 VD2",
    role: "value",
    type: "number"
  },
  ZIPout: {
    folder: "outputs",
    name: "Ausgang Zirkulationspumpe ZIP",
    role: "value",
    type: "number"
  },
  ZUPout: {
    folder: "outputs",
    name: "Ausgang Zusatzumw\xE4lzpumpe ZUP",
    role: "value",
    type: "number"
  },
  ZW1out: {
    folder: "outputs",
    name: "Ausgang Zweiter W\xE4rmeerzeuger 1 ZW1",
    role: "value",
    type: "number"
  },
  ZW2SSTout: {
    folder: "outputs",
    name: "Ausgang ZW2 / St\xF6rungsmeldung",
    role: "value",
    type: "number"
  },
  ZW3SSTout: {
    folder: "outputs",
    name: "Ausgang ZW3 / Sammelst\xF6rung",
    role: "value",
    type: "number"
  },
  FP2out: {
    folder: "outputs",
    name: "Ausgang Funktionspumpe 2 FP2",
    role: "value",
    type: "number"
  },
  analogOut1: {
    folder: "outputs",
    name: "Analoger Ausgang 1",
    role: "value",
    type: "number"
  },
  analogOut2: {
    folder: "outputs",
    name: "Analoger Ausgang 2",
    role: "value",
    type: "number"
  },
  analogOut3: {
    folder: "outputs",
    name: "Analoger Ausgang 3",
    role: "value",
    type: "number"
  },
  analogOut4: {
    folder: "outputs",
    name: "Analoger Ausgang 4",
    role: "value",
    type: "number"
  },
  Out_VZU: {
    folder: "outputs",
    name: "Ventilator Zuluft VZU",
    role: "value",
    type: "number"
  },
  Out_VAB: {
    folder: "outputs",
    name: "Ventilator Abluft VAB",
    role: "value",
    type: "number"
  },
  Out_VSK: {
    folder: "outputs",
    name: "Ausgang VSK",
    role: "value",
    type: "number"
  },
  Out_FRH: {
    folder: "outputs",
    name: "Ausgang Freigabe Heizung FRH",
    role: "value",
    type: "number"
  },
  defrostValve: {
    folder: "outputs",
    name: "Status Abtauventil",
    role: "value",
    type: "number"
  },
  hotWaterBoilerValve: {
    folder: "outputs",
    name: "Status Umschaltventil Warmwasser",
    role: "value",
    type: "number"
  },
  heatingSystemCircPump: {
    folder: "outputs",
    name: "Heizungssystem Zirkulationspumpe",
    role: "indicator",
    type: "boolean"
  },
  heatSourceMotor: {
    folder: "outputs",
    name: "Motor W\xE4rmequelle",
    role: "value",
    type: "number"
  },
  compressor1: {
    folder: "outputs",
    name: "Status Kompressor 1",
    role: "value",
    type: "number"
  },
  hotWaterCircPumpExtern: {
    folder: "outputs",
    name: "Warmwasser Zirkulationspumpe Extern",
    role: "value",
    type: "number"
  },
  // --- NEUE WERTE: Betriebsstunden & Zähler (Statistics) ---
  hours_compressor1: {
    folder: "statistics",
    name: "Betriebsstunden Kompressor 1",
    role: "value",
    type: "number",
    unit: "h"
  },
  starts_compressor1: {
    folder: "statistics",
    name: "Schaltspiele Kompressor 1",
    role: "value",
    type: "number"
  },
  hours_compressor2: {
    folder: "statistics",
    name: "Betriebsstunden Kompressor 2",
    role: "value",
    type: "number",
    unit: "h"
  },
  starts_compressor2: {
    folder: "statistics",
    name: "Schaltspiele Kompressor 2",
    role: "value",
    type: "number"
  },
  hours_2nd_heat_source1: {
    folder: "statistics",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 1",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_2nd_heat_source2: {
    folder: "statistics",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 2",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_2nd_heat_source3: {
    folder: "statistics",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 3",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_heatpump: {
    folder: "statistics",
    name: "Betriebsstunden W\xE4rmepumpe Gesamt",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_heating: {
    folder: "statistics",
    name: "Betriebsstunden Heizbetrieb",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_warmwater: {
    folder: "statistics",
    name: "Betriebsstunden Warmwassererzeugung",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_cooling: {
    folder: "statistics",
    name: "Betriebsstunden K\xFChlbetrieb",
    role: "value",
    type: "number",
    unit: "h"
  },
  Zaehler_BetrZeitSW: {
    folder: "statistics",
    name: "Betriebsstundenz\xE4hler SW",
    role: "value",
    type: "number",
    unit: "h"
  },
  thermalenergy_heating: {
    folder: "statistics",
    name: "W\xE4rmemenge Heizung",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  thermalenergy_warmwater: {
    folder: "statistics",
    name: "W\xE4rmemenge Warmwasser",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  thermalenergy_pool: {
    folder: "statistics",
    name: "W\xE4rmemenge Schwimmbad",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  thermalenergy_total: {
    folder: "statistics",
    name: "W\xE4rmemenge Gesamt",
    role: "value.power.consumption",
    type: "number",
    unit: "kWh"
  },
  // --- NEUE WERTE: Interne Zeiten & Timer (Timers) ---
  Time_WPein_akt: {
    folder: "timers",
    name: "Aktuelle Einschaltzeit W\xE4rmepumpe",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_ZWE1_akt: {
    folder: "timers",
    name: "Aktuelle Laufzeit ZWE1",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_ZWE2_akt: {
    folder: "timers",
    name: "Aktuelle Laufzeit ZWE2",
    role: "value",
    type: "number",
    unit: "s"
  },
  Timer_EinschVerz: {
    folder: "timers",
    name: "Einschaltverz\xF6gerung Timer",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SSPAUS_akt: {
    folder: "timers",
    name: "Aktuelle Sperrzeit AUS",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SSPEIN_akt: {
    folder: "timers",
    name: "Aktuelle Sperrzeit EIN",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_VDStd_akt: {
    folder: "timers",
    name: "Aktuelle Standzeit Verdichter",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_HRM_akt: {
    folder: "timers",
    name: "Aktuelle Zeit HRM",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_HRW_akt: {
    folder: "timers",
    name: "Aktuelle Zeit HRW",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_LGS_akt: {
    folder: "timers",
    name: "Aktuelle Zeit LGS",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SBW_akt: {
    folder: "timers",
    name: "Aktuelle Zeit SBW",
    role: "value",
    type: "number",
    unit: "s"
  },
  heatSourceDefrostTimer: {
    folder: "timers",
    name: "Abtautimer W\xE4rmequelle",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_Heissgas: {
    folder: "timers",
    name: "Zeit Hei\xDFgas\xFCberwachung",
    role: "value",
    type: "number",
    unit: "s"
  },
  ahp_Zeit: {
    folder: "timers",
    name: "Zeit ahp-Stufe",
    role: "value",
    type: "number",
    unit: "s"
  },
  // --- NEUE WERTE: Anlagenkonfiguration & Netzwerk (Info) ---
  typeHeatpump: {
    folder: "info",
    name: "W\xE4rmepumpen-Typ",
    role: "text",
    type: "string"
  },
  firmware: {
    folder: "info",
    name: "Firmware-Version",
    role: "text",
    type: "string"
  },
  AdresseIP_akt: {
    folder: "info",
    name: "Aktuelle IP-Adresse",
    role: "info.ip",
    type: "string"
  },
  SubNetMask_akt: {
    folder: "info",
    name: "Subnetzmaske",
    role: "info.ip",
    type: "string"
  },
  Add_Broadcast: {
    folder: "info",
    name: "Broadcast-Adresse",
    role: "info.ip",
    type: "string"
  },
  Add_StdGateway: {
    folder: "info",
    name: "Standard-Gateway",
    role: "info.ip",
    type: "string"
  },
  Comfort_exists: {
    folder: "info",
    name: "Comfort-Platine vorhanden",
    role: "value",
    type: "number"
  },
  Compact_exists: {
    folder: "info",
    name: "Compact-Bauform vorhanden",
    role: "value",
    type: "number"
  },
  LIN_exists: {
    folder: "info",
    name: "LIN-Bus vorhanden",
    role: "value",
    type: "number"
  },
  // --- NEUE WERTE: Aktueller Gerätestatus (Status / Exoten) ---
  bivalentLevel: {
    folder: "status",
    name: "Bivalenzstufe",
    role: "value",
    type: "number"
  },
  WP_BZ_akt: {
    folder: "status",
    name: "Aktueller Betriebszustand Code",
    role: "value",
    type: "number"
  },
  heatpump_state1: {
    folder: "status",
    name: "W\xE4rmepumpen Status-Code 1",
    role: "value",
    type: "number"
  },
  heatpump_state2: {
    folder: "status",
    name: "W\xE4rmepumpen Status-Code 2",
    role: "value",
    type: "number"
  },
  heatpump_state3: {
    folder: "status",
    name: "W\xE4rmepumpen Status-Code 3",
    role: "value",
    type: "number"
  },
  heatpump_duration: {
    folder: "status",
    name: "Dauer aktueller Zustand",
    role: "value",
    type: "number",
    unit: "s"
  },
  ahp_Stufe: {
    folder: "status",
    name: "Aktuelle ahp-Stufe",
    role: "value",
    type: "number"
  },
  ahp_Temp: {
    folder: "status",
    name: "Temperatur ahp-Stufe",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  opStateHotWater: {
    folder: "status",
    name: "Betriebszustand Warmwasser Code",
    role: "value",
    type: "number"
  },
  opStateHotWaterString: {
    folder: "status",
    name: "Betriebszustand Warmwasser Text",
    role: "text",
    type: "string"
  },
  opStateHeating: {
    folder: "status",
    name: "Betriebszustand Heizung Code",
    role: "value",
    type: "number"
  },
  opStateHeatingString: {
    folder: "status",
    name: "Betriebszustand Heizung Text",
    role: "text",
    type: "string"
  },
  Einst_Kurzprogramm: {
    folder: "status",
    name: "Einstellung Kurzprogramm",
    role: "value",
    type: "number"
  },
  StatusSlave_1: {
    folder: "status",
    name: "Status Slave 1",
    role: "value",
    type: "number"
  },
  StatusSlave_2: {
    folder: "status",
    name: "Status Slave 2",
    role: "value",
    type: "number"
  },
  StatusSlave_3: {
    folder: "status",
    name: "Status Slave 3",
    role: "value",
    type: "number"
  },
  StatusSlave_4: {
    folder: "status",
    name: "Status Slave 4",
    role: "value",
    type: "number"
  },
  StatusSlave_5: {
    folder: "status",
    name: "Status Slave 5",
    role: "value",
    type: "number"
  },
  rawDeviceTimeCalc: {
    folder: "info",
    name: "Berechnete Ger\xE4tezeit",
    role: "date",
    type: "string"
  },
  SH_SW: {
    folder: "status",
    name: "Status SH_SW",
    role: "value",
    type: "number"
  },
  SonderZeichen: {
    folder: "status",
    name: "Sonderzeichen Code",
    role: "value",
    type: "number"
  },
  SH_ZIP: {
    folder: "status",
    name: "Status SH_ZIP",
    role: "value",
    type: "number"
  },
  WebsrvProgrammWerteBeobarten: {
    folder: "status",
    name: "Webserver Programmwerte Beobachten",
    role: "value",
    type: "number"
  },
  flowRate: {
    folder: "status",
    name: "Durchflussmenge",
    role: "value",
    type: "number"
  },
  // --- NEUE WERTE: LIN-Bus Details ---
  LIN_TUE: {
    folder: "Informationen.Status",
    name: "LIN-Bus Verdampfer-Austrittstemperatur (TUE)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  LIN_TUE1: {
    folder: "Informationen.Status",
    name: "LIN-Bus Verdampfer-Austrittstemperatur 2 (TUE1)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  LIN_VDH: {
    folder: "Informationen.Status",
    name: "LIN-Bus Hei\xDFgastemperatur Verdichter (VDH)",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  LIN_UH: {
    folder: "Informationen.Status",
    name: "LIN-Bus \xDCberhitzung Ist (UH)",
    role: "value.temperature",
    type: "number",
    unit: "K"
  },
  LIN_UH_Soll: {
    folder: "Informationen.Status",
    name: "LIN-Bus \xDCberhitzung Soll",
    role: "value.temperature",
    type: "number",
    unit: "K"
  },
  LIN_HD: {
    folder: "Informationen.Status",
    name: "LIN-Bus Hochdruck",
    role: "value.pressure",
    type: "number",
    unit: "bar"
  },
  LIN_ND: {
    folder: "Informationen.Status",
    name: "LIN-Bus Niederdruck",
    role: "value.pressure",
    type: "number",
    unit: "bar"
  },
  LIN_VDH_out: {
    folder: "Informationen.Status",
    name: "LIN-Bus Verdichterkopfheizung Ansteuerung",
    role: "value",
    type: "number",
    unit: "%"
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  STATE_MAPPING
});
//# sourceMappingURL=stateMapping.js.map

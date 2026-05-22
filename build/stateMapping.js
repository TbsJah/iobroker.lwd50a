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
  // EINSTELLUNGEN & PARAMETER (Beschreibbar)
  // ==========================================
  warmwater_temperature: {
    folder: "Parameter",
    name: "Warmwasser Soll-Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "temperature_hot_water_target",
    min: 40,
    max: 65
  },
  heating_operation_mode: {
    folder: "Einstellungen.Parameter",
    name: "Betriebsart Heizung",
    role: "level.mode",
    type: "number",
    write: true,
    luxWriteId: "heating_operation_mode",
    states: {
      0: "Automatik",
      1: "Zusatzheizung",
      2: "Party",
      3: "Ferien",
      4: "Aus"
    }
  },
  // ==========================================
  // INFORMATIONEN: TEMPERATUREN
  // ==========================================
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
  temperature_hot_water: {
    folder: "Informationen.Temperaturen",
    name: "Warmwassertemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_heat_source_in: {
    folder: "Informationen.Temperaturen",
    name: "W\xE4rmequelle Eintritt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_heat_source_out: {
    folder: "Informationen.Temperaturen",
    name: "W\xE4rmequelle Austritt",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_mixer1_flow: {
    folder: "Informationen.Temperaturen",
    name: "Mischkreis 1 Vorlauf Ist",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_mixer1_target: {
    folder: "Informationen.Temperaturen",
    name: "Mischkreis 1 Vorlauf Soll",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_mixer3_flow: {
    folder: "Informationen.Temperaturen",
    name: "Mischkreis 3 Vorlauf Ist",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_mixer3_target: {
    folder: "Informationen.Temperaturen",
    name: "Mischkreis 3 Vorlauf Soll",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperaturw_RFV: {
    folder: "Informationen.Temperaturen",
    name: "Raumfernversteller RFV1",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  Temperatur_RFV2: {
    folder: "Informationen.Temperaturen",
    name: "Raumfernversteller RFV2",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  Temperatur_RFV3: {
    folder: "Informationen.Temperaturen",
    name: "Raumfernversteller RFV3",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_solar_collector: {
    folder: "Informationen.Temperaturen",
    name: "Solar-Kollektortemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_solar_storage: {
    folder: "Informationen.Temperaturen",
    name: "Solar-Speichertemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_external_source: {
    folder: "Informationen.Temperaturen",
    name: "Externe Energiequelle Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  Temp_Lueftung_Zuluft: {
    folder: "Informationen.Temperaturen",
    name: "L\xFCftung Zuluft Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  Temp_Lueftung_Abluft: {
    folder: "Informationen.Temperaturen",
    name: "L\xFCftung Abluft Temperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  // ==========================================
  // INFORMATIONEN: KÄLTEKREIS (Temperaturen & Regelung)
  // ==========================================
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
  // ==========================================
  // INFORMATIONEN: DIGITALE & ANALOGE EINGÄNGE
  // ==========================================
  ASDin: {
    folder: "Informationen.Eingaenge",
    name: "Abtau-Endeschalter ASD",
    role: "value",
    type: "number"
  },
  BWTin: {
    folder: "Informationen.Eingaenge",
    name: "Brauchwasserthermostat BWT",
    role: "value",
    type: "number"
  },
  EVUin: {
    folder: "Informationen.Eingaenge",
    name: "EVU-Sperre",
    role: "value",
    type: "number"
  },
  HDin: {
    folder: "Informationen.Eingaenge",
    name: "Hochdruckw\xE4chter HD",
    role: "value",
    type: "number"
  },
  MOTin: {
    folder: "Informationen.Eingaenge",
    name: "Motorschutz MOT",
    role: "value",
    type: "number"
  },
  NDin: {
    folder: "Informationen.Eingaenge",
    name: "Niederdruckw\xE4chter ND",
    role: "value",
    type: "number"
  },
  NDin_pressure: {
    folder: "Informationen.Eingaenge",
    name: "Niederdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar"
  },
  HDin_pressure: {
    folder: "Informationen.Eingaenge",
    name: "Hochdruck-Sensorwert",
    role: "value.pressure",
    type: "number",
    unit: "bar"
  },
  PEXin: {
    folder: "Informationen.Eingaenge",
    name: "Externer Druckw\xE4chter PEX",
    role: "value",
    type: "number"
  },
  SWTin: {
    folder: "Informationen.Eingaenge",
    name: "Schwimmbadthermostat SWT",
    role: "value",
    type: "number"
  },
  AnalogIn: {
    folder: "Informationen.Eingaenge",
    name: "Analoger Eingang 1",
    role: "value",
    type: "number",
    unit: "V"
  },
  AnalogIn2: {
    folder: "Informationen.Eingaenge",
    name: "Analoger Eingang 2",
    role: "value",
    type: "number",
    unit: "V"
  },
  AnalogIn3: {
    folder: "Informationen.Eingaenge",
    name: "Analoger Eingang 3",
    role: "value",
    type: "number",
    unit: "V"
  },
  SAXin: {
    folder: "Informationen.Eingaenge",
    name: "Eingang SAX",
    role: "value",
    type: "number"
  },
  SPLin: {
    folder: "Informationen.Eingaenge",
    name: "Eingang SPL",
    role: "value",
    type: "number"
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
      0: "AUS",
      1: "EIN"
    }
  },
  BUPout: {
    folder: "Informationen.Ausgaenge",
    name: "Warmwasser-Umw\xE4lzpumpe BUP",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  HUPout: {
    folder: "Informationen.Ausgaenge",
    name: "Heizungsumw\xE4lzpumpe HUP",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  MA1out: {
    folder: "Informationen.Ausgaenge",
    name: "Mischer 1 Auf MA1",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  MZ1out: {
    folder: "Informationen.Ausgaenge",
    name: "Mischer 1 Zu MZ1",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  VENout: {
    folder: "Informationen.Ausgaenge",
    name: "Ventilator VEN",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  VBOout: {
    folder: "Informationen.Ausgaenge",
    name: "Ventilausgang Brunnen VBO",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  VD1out: {
    folder: "Informationen.Ausgaenge",
    name: "Verdichter 1 VD1",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  VD2out: {
    folder: "Informationen.Ausgaenge",
    name: "Verdichter 2 VD2",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  ZIPout: {
    folder: "Informationen.Ausgaenge",
    name: "Zirkulationspumpe ZIP",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  ZUPout: {
    folder: "Informationen.Ausgaenge",
    name: "Zusatzumw\xE4lzpumpe ZUP",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  ZW1out: {
    folder: "Informationen.Ausgaenge",
    name: "Zweiter W\xE4rmeerzeuger 1 ZW1",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  ZW2SSTout: {
    folder: "Informationen.Ausgaenge",
    name: "ZW2 / St\xF6rungsmeldung",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  ZW3SSTout: {
    folder: "Informationen.Ausgaenge",
    name: "ZW3 / Sammelst\xF6rung",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  FP2out: {
    folder: "Informationen.Ausgaenge",
    name: "Funktionspumpe 2 FP2",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  SLPout: {
    folder: "Informationen.Ausgaenge",
    name: "Solarladepumpe SLP",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  SUPout: {
    folder: "Informationen.Ausgaenge",
    name: "Zusatzpumpe SUP",
    role: "value",
    type: "number"
  },
  MZ2out: {
    folder: "Informationen.Ausgaenge",
    name: "Mischer 2 Zu MZ2",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  MA2out: {
    folder: "Informationen.Ausgaenge",
    name: "Mischer 2 Auf MA2",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  MZ3out: {
    folder: "Informationen.Ausgaenge",
    name: "Mischer 3 Zu MZ3",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  MA3out: {
    folder: "Informationen.Ausgaenge",
    name: "Mischer 3 Auf MA3",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  FP3out: {
    folder: "Informationen.Ausgaenge",
    name: "Funktionspumpe 3 FP3",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
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
  analogOut3: {
    folder: "Informationen.Ausgaenge",
    name: "Analoger Ausgang 3",
    role: "value",
    type: "number",
    unit: "V"
  },
  analogOut4: {
    folder: "Informationen.Ausgaenge",
    name: "Analoger Ausgang 4",
    role: "value",
    type: "number",
    unit: "V"
  },
  Out_VZU: {
    folder: "Informationen.Ausgaenge",
    name: "Ventilator Zuluft VZU",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  Out_VAB: {
    folder: "Informationen.Ausgaenge",
    name: "Ventilator Abluft VAB",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  Out_VSK: {
    folder: "Informationen.Ausgaenge",
    name: "Ausgang VSK",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  Out_FRH: {
    folder: "Informationen.Ausgaenge",
    name: "Freigabe Heizung FRH",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  defrostValve: {
    folder: "Informationen.Ausgaenge",
    name: "Status Abtauventil",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  hotWaterBoilerValve: {
    folder: "Informationen.Ausgaenge",
    name: "Status Umschaltventil Warmwasser",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
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
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  compressor1: {
    folder: "Informationen.Ausgaenge",
    name: "Status Kompressor 1 Laufr\xFCckmeldung",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  hotWaterCircPumpExtern: {
    folder: "Informationen.Ausgaenge",
    name: "Warmwasser Zirkulationspumpe Extern",
    role: "value",
    type: "number",
    states: {
      0: "AUS",
      1: "EIN"
    }
  },
  // ==========================================
  // INFORMATIONEN: STATISTIKEN & ENERGIEZÄHLER
  // ==========================================
  hours_compressor1: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Kompressor 1",
    role: "value",
    type: "number",
    unit: "h"
  },
  starts_compressor1: {
    folder: "Informationen.Statistik",
    name: "Schaltspiele Kompressor 1",
    role: "value",
    type: "number"
  },
  hours_compressor2: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Kompressor 2",
    role: "value",
    type: "number",
    unit: "h"
  },
  starts_compressor2: {
    folder: "Informationen.Statistik",
    name: "Schaltspiele Kompressor 2",
    role: "value",
    type: "number"
  },
  hours_2nd_heat_source1: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 1 (Heizstab)",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_2nd_heat_source2: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 2",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_2nd_heat_source3: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Zweiter W\xE4rmeerzeuger 3",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_heatpump: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden W\xE4rmepumpe Gesamt",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_heating: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Heizbetrieb",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_warmwater: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Warmwassererzeugung",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_cooling: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden K\xFChlbetrieb",
    role: "value",
    type: "number",
    unit: "h"
  },
  hours_solar: {
    folder: "Informationen.Statistik",
    name: "Betriebsstunden Solaranlage",
    role: "value",
    type: "number",
    unit: "h"
  },
  Zaehler_BetrZeitSW: {
    folder: "Informationen.Statistik",
    name: "Betriebsstundenz\xE4hler SW",
    role: "value",
    type: "number",
    unit: "h"
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
  // ==========================================
  // INFORMATIONEN: TIMER & VERZÖGERUNGEN
  // ==========================================
  Time_WPein_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Einschaltzeit W\xE4rmepumpe",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_ZWE1_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Laufzeit ZWE1",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_ZWE2_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Laufzeit ZWE2",
    role: "value",
    type: "number",
    unit: "s"
  },
  Timer_EinschVerz: {
    folder: "Informationen.Timer",
    name: "Einschaltverz\xF6gerung Restzeit",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SSPAUS_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Sperrzeit AUS",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SSPEIN_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Sperrzeit EIN",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_VDStd_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Standzeit Verdichter",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_HRM_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Zeit HRM",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_HRW_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Zeit HRW",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_LGS_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Zeit LGS",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_SBW_akt: {
    folder: "Informationen.Timer",
    name: "Aktuelle Zeit SBW",
    role: "value",
    type: "number",
    unit: "s"
  },
  heatSourceDefrostTimer: {
    folder: "Informationen.Timer",
    name: "Abtautimer W\xE4rmequelle",
    role: "value",
    type: "number",
    unit: "s"
  },
  Time_Heissgas: {
    folder: "Informationen.Timer",
    name: "Zeit Hei\xDFgas\xFCberwachung",
    role: "value",
    type: "number",
    unit: "s"
  },
  ahp_Zeit: {
    folder: "Informationen.Timer",
    name: "Zeit ahp-Stufe",
    role: "value",
    type: "number",
    unit: "s"
  },
  // ==========================================
  // INFORMATIONEN: SYSTEMINFO & NETZWERK
  // ==========================================
  typeHeatpump: {
    folder: "Informationen.Systeminfo",
    name: "W\xE4rmepumpen-Typ",
    role: "text",
    type: "string"
  },
  firmware: {
    folder: "Informationen.Systeminfo",
    name: "Firmware-Version",
    role: "text",
    type: "string"
  },
  AdresseIP_akt: {
    folder: "Informationen.Systeminfo",
    name: "Aktuelle IP-Adresse",
    role: "info.ip",
    type: "string"
  },
  SubNetMask_akt: {
    folder: "Informationen.Systeminfo",
    name: "Subnetzmaske",
    role: "info.ip",
    type: "string"
  },
  Add_Broadcast: {
    folder: "Informationen.Systeminfo",
    name: "Broadcast-Adresse",
    role: "info.ip",
    type: "string"
  },
  Add_StdGateway: {
    folder: "Informationen.Systeminfo",
    name: "Standard-Gateway",
    role: "info.ip",
    type: "string"
  },
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
  LIN_exists: {
    folder: "Informationen.Systeminfo",
    name: "LIN-Bus vorhanden",
    role: "value",
    type: "number"
  },
  rawDeviceTimeCalc: {
    folder: "Informationen.Systeminfo",
    name: "Berechnete Ger\xE4tezeit",
    role: "date",
    type: "string"
  },
  // ==========================================
  // INFORMATIONEN: STATUS & CODES
  // ==========================================
  status_heating: {
    folder: "Informationen.Status",
    name: "Status Heizbetrieb",
    role: "indicator",
    type: "boolean"
  },
  bivalentLevel: {
    folder: "Informationen.Status",
    name: "Bivalenzstufe",
    role: "value",
    type: "number"
  },
  WP_BZ_akt: {
    folder: "Informationen.Status",
    name: "Aktueller Betriebszustand Code",
    role: "value",
    type: "number"
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
  ahp_Stufe: {
    folder: "Informationen.Status",
    name: "Aktuelle ahp-Stufe",
    role: "value",
    type: "number"
  },
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
  opStateHotWaterString: {
    folder: "Informationen.Status",
    name: "Betriebszustand Warmwasser Text",
    role: "text",
    type: "string"
  },
  opStateHeating: {
    folder: "Informationen.Status",
    name: "Betriebszustand Heizung Code",
    role: "value",
    type: "number"
  },
  opStateHeatingString: {
    folder: "Informationen.Status",
    name: "Betriebszustand Heizung Text",
    role: "text",
    type: "string"
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
  StatusSlave_1: {
    folder: "Informationen.Status",
    name: "Status Slave 1",
    role: "value",
    type: "number"
  },
  StatusSlave_2: {
    folder: "Informationen.Status",
    name: "Status Slave 2",
    role: "value",
    type: "number"
  },
  StatusSlave_3: {
    folder: "Informationen.Status",
    name: "Status Slave 3",
    role: "value",
    type: "number"
  },
  StatusSlave_4: {
    folder: "Informationen.Status",
    name: "Status Slave 4",
    role: "value",
    type: "number"
  },
  StatusSlave_5: {
    folder: "Informationen.Status",
    name: "Status Slave 5",
    role: "value",
    type: "number"
  },
  SH_SW: {
    folder: "Informationen.Status",
    name: "Status SH_SW",
    role: "value",
    type: "number"
  },
  FreigabKuehl: {
    folder: "Informationen.Status",
    name: "Freigabe K\xFChlung",
    role: "value",
    type: "number"
  },
  SonderZeichen: {
    folder: "Informationen.Status",
    name: "Sonderzeichen Code",
    role: "value",
    type: "number"
  },
  SH_ZIP: {
    folder: "Informationen.Status",
    name: "Status SH_ZIP",
    role: "value",
    type: "number"
  },
  WebsrvProgrammWerteBeobarten: {
    folder: "Informationen.Status",
    name: "Webserver Programmwerte Beobachten",
    role: "value",
    type: "number"
  },
  Durchfluss_WQ: {
    folder: "Informationen.Status",
    name: "Durchfluss W\xE4rmequelle",
    role: "value",
    type: "number"
  },
  flowRate: {
    folder: "Informationen.Status",
    name: "Durchflussmenge",
    role: "value",
    type: "number"
  },
  // ==========================================
  // INFORMATIONEN: INTERNER LIN-BUS DETAILWERTE
  // ==========================================
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

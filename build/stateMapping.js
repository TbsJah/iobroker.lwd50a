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
    folder: "Temperaturen",
    name: "Heizkurve Endpunkt-Offset",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    LuxID: "heating_curve_end_point",
    min: 20,
    max: 35
  },
  heating_curve_parallel_offset: {
    folder: "Temperaturen",
    name: "Heizkurve Endpunkt-Offset",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    LuxID: "heating_curve_parallel_offset",
    min: 20,
    max: 35
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
  temperature_supply: {
    folder: "Temperaturen",
    name: "Vorlauftemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_return: {
    folder: "Temperaturen",
    name: "R\xFCcklauftemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_outside: {
    folder: "Temperaturen",
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
    unit: "\xB0C",
    write: true,
    LuxID: "temperature_hot_water_target",
    min: 40,
    max: 65
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
  heatpump_state_string: {
    folder: "Information",
    name: "Status Text",
    role: "text",
    type: "string"
  },
  heatpump_extendet_state_string: {
    folder: "Information",
    name: "Status Text Erweitert",
    role: "text",
    type: "string"
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  STATE_MAPPING
});
//# sourceMappingURL=stateMapping.js.map

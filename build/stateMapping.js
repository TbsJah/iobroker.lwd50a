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
  temperature_hot_water: {
    folder: "Temperaturen",
    name: "Warmwassertemperatur",
    role: "value.temperature",
    type: "number",
    unit: "\xB0C"
  },
  temperature_hot_water_target: {
    folder: "Parameter",
    name: "Warmwasser Soll-Temperatur",
    role: "level.temperature",
    type: "number",
    unit: "\xB0C",
    write: true,
    luxWriteId: "warmwater_target_temperature",
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
  },
  heating_operation_mode: {
    folder: "Modus",
    name: "Betriebsart Heizung",
    role: "level.mode",
    // "level.mode" passt perfekt für Dropdowns
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
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  STATE_MAPPING
});
//# sourceMappingURL=stateMapping.js.map

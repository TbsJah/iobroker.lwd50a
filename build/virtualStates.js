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
var virtualStates_exports = {};
__export(virtualStates_exports, {
  calculateTotalHours: () => calculateTotalHours,
  initializeVirtualStates: () => initializeVirtualStates
});
module.exports = __toCommonJS(virtualStates_exports);
var import_stateMapping = require("./stateMapping");
async function initializeVirtualStates(adapter) {
  try {
    for (const [key, definition] of Object.entries(import_stateMapping.STATE_MAPPING)) {
      if (definition.isVirtual) {
        const fullId = `${definition.folder}.${key}`;
        adapter.log.info(`[Virtual DP] Erstelle/Pr\xFCfe virtuellen Datenpunkt: ${fullId}`);
        await adapter.setObjectNotExistsAsync(fullId, {
          type: "state",
          common: {
            name: definition.name,
            type: definition.type,
            role: definition.role,
            unit: definition.unit,
            read: true,
            write: !!definition.write,
            states: definition.states
          },
          native: {}
        });
        const currentState = await adapter.getStateAsync(fullId);
        if (!currentState) {
          const defaultVal = definition.type === "number" ? 0 : definition.type === "boolean" ? false : "";
          await adapter.setStateAsync(fullId, { val: defaultVal, ack: true });
        }
        if (definition.write) {
          await adapter.subscribeStatesAsync(fullId);
          adapter.log.info(`[Virtual DP] Schreib-Kanal abonniert f\xFCr: ${fullId}`);
        }
      }
    }
  } catch (err) {
    adapter.log.error(`Fehler bei der automatischen Initialisierung der virtuellen Datenpunkte: ${err.message}`);
  }
}
async function calculateTotalHours(adapter) {
  try {
    const heatingState = await adapter.getStateAsync("Informationen.Betriebsstunden.hours_heating");
    const warmwaterState = await adapter.getStateAsync("Informationen.Betriebsstunden.hours_warmwater");
    const hoursHeating = heatingState && typeof heatingState.val === "number" ? heatingState.val : 0;
    const hoursWarmwater = warmwaterState && typeof warmwaterState.val === "number" ? warmwaterState.val : 0;
    const totalHours = hoursHeating + hoursWarmwater;
    await adapter.setStateAsync("Informationen.Betriebsstunden.Betriebsstunden_Gesamt", totalHours, true);
  } catch (err) {
    adapter.log.error(`Fehler bei der Berechnung der Gesamt-Betriebsstunden: ${err.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateTotalHours,
  initializeVirtualStates
});
//# sourceMappingURL=virtualStates.js.map

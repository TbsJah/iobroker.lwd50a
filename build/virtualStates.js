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
  calculateTotalHours: () => calculateTotalHours
});
module.exports = __toCommonJS(virtualStates_exports);
async function calculateTotalHours(adapter) {
  try {
    const heatingState = await adapter.getStateAsync("Informationen.Statistik.hours_heating");
    const warmwaterState = await adapter.getStateAsync("Informationen.Statistik.hours_warmwater");
    const hoursHeating = heatingState && typeof heatingState.val === "number" ? heatingState.val : 0;
    const hoursWarmwater = warmwaterState && typeof warmwaterState.val === "number" ? warmwaterState.val : 0;
    const totalHours = hoursHeating + hoursWarmwater;
    await adapter.setStateAsync("Informationen.Statistik.hours_total_calculated", totalHours, true);
    adapter.log.debug(
      `[Virtual DP] Gesamtstunden aktualisiert: ${totalHours}h (${hoursHeating}h Heizung + ${hoursWarmwater}h WW)`
    );
  } catch (err) {
    adapter.log.error(`Fehler bei der Berechnung der Gesamt-Betriebsstunden: ${err.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateTotalHours
});
//# sourceMappingURL=virtualStates.js.map

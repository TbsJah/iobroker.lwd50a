"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var virtualStates_exports = {};
__export(virtualStates_exports, {
  initializeVirtualStates: () => initializeVirtualStates,
  updateErrorHistory: () => updateErrorHistory
});
module.exports = __toCommonJS(virtualStates_exports);
var import_stateMapping = require("./stateMapping");
var luxtronikTypes = __toESM(require("luxtronik2/types"));
async function initializeVirtualStates(adapter) {
  try {
    for (const [key, definition] of Object.entries(import_stateMapping.STATE_MAPPING)) {
      if (definition.isVirtual) {
        const folderId = definition.folder;
        const fullId = `${folderId}.${key}`;
        await adapter.setObjectNotExistsAsync(folderId, {
          type: "channel",
          common: { name: folderId.split(".").pop() || folderId },
          native: {}
        });
        const ioBrokerType = definition.type === "json" ? "string" : definition.type;
        await adapter.setObjectNotExistsAsync(fullId, {
          type: "state",
          common: {
            name: definition.name,
            type: ioBrokerType,
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
          const defaultVal = definition.type === "json" ? "[]" : definition.type === "number" ? 0 : false;
          await adapter.setStateAsync(fullId, { val: defaultVal, ack: true });
        }
        if (definition.write) {
          await adapter.subscribeStatesAsync(fullId);
        }
      }
    }
  } catch (err) {
    adapter.log.error(`Fehler bei der Initialisierung der virtuellen Datenpunkte: ${err.message}`);
  }
}
async function updateErrorHistory(adapter, rawValues) {
  try {
    if (!rawValues || rawValues.length < 105) {
      adapter.log.debug("[Virtual DP] Fehlerhistorie \xFCbersprungen: Unvollst\xE4ndiges Raw-Array 3004.");
      return;
    }
    const errorLogList = [];
    for (let i = 0; i < 5; i++) {
      const errorTimestamp = rawValues[95 + i];
      const errorCode = rawValues[100 + i];
      if (errorCode !== 0) {
        const dateObject = new Date(errorTimestamp * 1e3);
        const readableDate = errorTimestamp > 0 ? dateObject.toLocaleString("de-DE") : "Unbekannt";
        let fehlerText = `Unbekannter Fehler (${errorCode})`;
        if (luxtronikTypes) {
          const TypesAny = luxtronikTypes;
          if (TypesAny.errorCodes && TypesAny.errorCodes[errorCode]) {
            fehlerText = TypesAny.errorCodes[errorCode];
          } else if (TypesAny.codes && TypesAny.codes[errorCode]) {
            fehlerText = TypesAny.codes[errorCode];
          } else if (TypesAny[errorCode]) {
            fehlerText = TypesAny[errorCode];
          }
        }
        errorLogList.push({
          index: i + 1,
          code: errorCode,
          beschreibung: fehlerText,
          datum: readableDate,
          timestamp: errorTimestamp
        });
      }
    }
    const jsonString = JSON.stringify(errorLogList);
    await adapter.setStateChangedAsync("Informationen.06_Fehlerspeicher.Fehlerspeicher", jsonString, true);
    adapter.log.debug(`[Virtual DP] RAW-Fehlerhistorie aktualisiert. ${errorLogList.length} Eintr\xE4ge hinterlegt.`);
  } catch (err) {
    adapter.log.error(`Fehler bei der Generierung der RAW-JSON-Fehlerhistorie: ${err.message}`);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initializeVirtualStates,
  updateErrorHistory
});
//# sourceMappingURL=virtualStates.js.map

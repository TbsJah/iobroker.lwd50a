"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var utils = __toESM(require("@iobroker/adapter-core"));
var luxtronik = __toESM(require("luxtronik2"));
var net = __toESM(require("net"));
var import_stateMapping = require("./stateMapping");
var import_virtualStates = require("./virtualStates");
class Lwd50a extends utils.Adapter {
  pollingInterval;
  pump;
  createdStates = /* @__PURE__ */ new Set();
  constructor(options = {}) {
    super({
      ...options,
      name: "lwd50a"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    const ip = this.config.host;
    const port = this.config.port || 8889;
    this.log.info(`Verbinde mit W\xE4rmepumpe auf ${ip}:${port}...`);
    this.pump = new luxtronik.createConnection(ip, port);
    await (0, import_virtualStates.initializeVirtualStates)(this);
    await this.updateData();
    void this.dumpAllRawToLog();
    let intervalSeconds = this.config.interval || 30;
    if (intervalSeconds < 10) {
      intervalSeconds = 10;
      this.log.warn("Eingestelltes Intervall war zu kurz. Wurde zum Schutz auf 10 Sekunden korrigiert.");
    }
    this.log.info(`Starte Polling-Intervall. Lese Daten alle ${intervalSeconds} Sekunden aus.`);
    this.pollingInterval = setInterval(() => {
      void this.updateData();
    }, intervalSeconds * 1e3);
  }
  async dumpAllRawToLog() {
    try {
      const dumpList = async (command, title) => {
        this.log.info("=======================================================");
        this.log.info(`START COMPACT RAW DUMP: LISTE ${command} (${title})`);
        this.log.info("=======================================================");
        const data = await this.readAllRaw(command);
        for (let i = 0; i < data.length; i++) {
          this.log.info(`[RAW ${command}] Index ${i.toString().padStart(3, " ")} = ${data[i]}`);
        }
        this.log.info(`--- ENDE LISTE ${command} (Insgesamt ${data.length} Indizes geloggt) ---`);
        this.log.info("=======================================================");
      };
      await dumpList(3003, "PARAMETER");
      await dumpList(3004, "MESSWERTE");
    } catch (err) {
      this.log.error(`Fehler beim Ausf\xFChren des Raw-Dumps: ${err.message}`);
    }
  }
  readAllRaw(command) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const host = this.config.host;
      const port = 8888;
      let responseData = Buffer.alloc(0);
      client.connect(port, host, () => {
        const buffer = Buffer.alloc(8);
        buffer.writeInt32BE(command, 0);
        buffer.writeInt32BE(0, 4);
        client.write(buffer);
      });
      client.on("data", (chunk) => {
        responseData = Buffer.concat([responseData, chunk]);
        const is3004 = command === 3004;
        const headerSize = is3004 ? 12 : 8;
        const lengthOffset = is3004 ? 8 : 4;
        if (responseData.length >= headerSize) {
          const responseCommand = responseData.readInt32BE(0);
          if (responseCommand === command) {
            const totalItems = responseData.readInt32BE(lengthOffset);
            const totalRequiredLength = headerSize + totalItems * 4;
            if (responseData.length >= totalRequiredLength) {
              const allValues = [];
              for (let i = 0; i < totalItems; i++) {
                const valueOffset = headerSize + i * 4;
                allValues.push(responseData.readInt32BE(valueOffset));
              }
              client.destroy();
              resolve(allValues);
            }
          }
        }
      });
      client.on("error", (err) => {
        client.destroy();
        reject(err);
      });
      client.setTimeout(8e3);
      client.on("timeout", () => {
        client.destroy();
        reject(new Error(`Timeout beim Auslesen der kompletten Liste ${command}.`));
      });
    });
  }
  formatSecondsToHMS(totalSeconds) {
    if (totalSeconds < 0 || isNaN(totalSeconds)) {
      return "00:00:00";
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  readPumpAsync() {
    return new Promise((resolve, reject) => {
      this.pump.read((err, data) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } else {
          resolve(data);
        }
      });
    });
  }
  writePumpAsync(cmd, val, isRaw = false) {
    return new Promise((resolve, reject) => {
      const cb = (err) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } else {
          resolve();
        }
      };
      if (isRaw) {
        this.pump.writeRaw(cmd, val, cb);
      } else {
        this.pump.write(cmd, val, cb);
      }
    });
  }
  async updateData() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!this.pump) {
      this.log.error("Abfrage abgebrochen: Keine aktive Verbindung zur W\xE4rmepumpe vorhanden.");
      return;
    }
    try {
      const [rawParams, rawValues, coolchipData] = await Promise.all([
        this.readAllRaw(3003).catch((err) => {
          this.log.debug(`Raw-Parameter (3003) nicht verf\xFCgbar: ${err.message}`);
          return [];
        }),
        this.readAllRaw(3004).catch((err) => {
          this.log.debug(`Raw-Messwerte (3004) nicht verf\xFCgbar: ${err.message}`);
          return [];
        }),
        this.readPumpAsync().catch((err) => {
          var _a2;
          if ((_a2 = err.message) == null ? void 0 : _a2.toLowerCase().includes("busy")) {
            this.log.warn("W\xE4rmepumpe ist ausgelastet (busy). \xDCberspringe diesen Abfrage-Zyklus.");
          } else {
            this.log.error(`Verbindungsfehler beim Einlesen der Daten: ${err.message}`);
          }
          return null;
        })
      ]);
      if (!coolchipData) {
        return;
      }
      for (const [key, definition] of Object.entries(import_stateMapping.STATE_MAPPING)) {
        if (definition.isVirtual) {
          continue;
        }
        const configWithDynamicKeys = this.config;
        if (configWithDynamicKeys[`sync_${key}`] === false) {
          continue;
        }
        const luxId = definition.luxWriteId || key;
        let value = void 0;
        if (definition.dataSource) {
          switch (definition.dataSource) {
            case "raw_parameter": {
              const index = parseInt(luxId, 10);
              if (!isNaN(index) && (rawParams == null ? void 0 : rawParams[index]) !== void 0) {
                value = rawParams[index];
                if (definition.factor) {
                  value /= definition.factor;
                }
              }
              break;
            }
            case "raw_value": {
              const index = parseInt(luxId, 10);
              if (!isNaN(index) && (rawValues == null ? void 0 : rawValues[index]) !== void 0) {
                value = rawValues[index];
                if (definition.factor) {
                  value /= definition.factor;
                }
              }
              break;
            }
            case "parameter":
              value = (_a = coolchipData == null ? void 0 : coolchipData.parameters) == null ? void 0 : _a[luxId];
              break;
            case "value":
              value = (_b = coolchipData == null ? void 0 : coolchipData.values) == null ? void 0 : _b[luxId];
              break;
            case "additional":
              value = (_c = coolchipData == null ? void 0 : coolchipData.additional) == null ? void 0 : _c[luxId];
              break;
          }
        } else {
          const isRawNumber = /^\d+$/.test(luxId);
          if (isRawNumber) {
            const index = parseInt(luxId, 10);
            if (!isNaN(index)) {
              if (definition.folder.startsWith("Einstellungen") && (rawParams == null ? void 0 : rawParams[index]) !== void 0) {
                value = rawParams[index];
              } else if (definition.folder.startsWith("Informationen") && (rawValues == null ? void 0 : rawValues[index]) !== void 0) {
                value = rawValues[index];
              }
              if (value !== void 0 && typeof value === "number" && definition.factor) {
                value = value / definition.factor;
              }
            }
          } else {
            value = (_h = (_f = (_d = coolchipData == null ? void 0 : coolchipData.values) == null ? void 0 : _d[luxId]) != null ? _f : (_e = coolchipData == null ? void 0 : coolchipData.parameters) == null ? void 0 : _e[luxId]) != null ? _h : (_g = coolchipData == null ? void 0 : coolchipData.additional) == null ? void 0 : _g[luxId];
          }
        }
        if (value !== void 0) {
          if (definition.type === "number" && typeof value === "string") {
            const textVal = value.toLowerCase();
            value = textVal === "ein" ? 1 : textVal === "aus" ? 0 : parseFloat(value);
          } else if (definition.type === "boolean") {
            if (typeof value === "string") {
              const textVal = value.toLowerCase();
              value = textVal === "ein" || textVal === "true" || textVal === "1";
            } else {
              value = value === true || value === 1;
            }
          } else if (definition.type === "json" && typeof value === "object") {
            value = JSON.stringify(value);
          }
          let targetType = definition.type === "json" ? "string" : definition.type;
          let targetRole = definition.role;
          let targetUnit = definition.unit;
          if (definition.unit === "s") {
            const totalSeconds = typeof value === "number" ? value : parseInt(value, 10);
            if (!isNaN(totalSeconds)) {
              value = this.formatSecondsToHMS(totalSeconds);
              targetType = "string";
              targetRole = "text";
              targetUnit = void 0;
            }
          } else if (definition.role === "value.datetime") {
            const totalSeconds = typeof value === "number" ? value : parseInt(value, 10);
            if (!isNaN(totalSeconds) && totalSeconds >= 0) {
              if (totalSeconds < 86400) {
                const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
                const m = Math.floor(totalSeconds % 3600 / 60).toString().padStart(2, "0");
                value = `${h}:${m}`;
              } else {
                value = new Date(totalSeconds * 1e3).toLocaleString("de-DE");
              }
              targetType = "string";
              targetUnit = void 0;
            }
          }
          const folderId = definition.folder;
          const stateId = `${folderId}.${key}`;
          if (!this.createdStates.has(stateId)) {
            await this.setObjectNotExistsAsync(folderId, {
              type: "channel",
              common: { name: folderId.split(".").pop() || folderId },
              native: {}
            });
            await this.setObjectNotExistsAsync(stateId, {
              type: "state",
              common: {
                name: definition.name,
                type: targetType,
                role: targetRole,
                unit: targetUnit,
                read: true,
                write: definition.write || false,
                min: definition.min,
                max: definition.max,
                states: definition.states
              },
              native: {}
            });
            if (definition.write) {
              await this.subscribeStatesAsync(stateId);
            }
            this.createdStates.add(stateId);
          }
          await this.setStateChangedAsync(stateId, value, true);
        }
      }
      await (0, import_virtualStates.calculateTotalThermalEnergy)(this);
      await (0, import_virtualStates.calculateTotalEnergy)(this);
      await (0, import_virtualStates.updateErrorHistory)(this, rawValues);
      await (0, import_virtualStates.updateOutageHistory)(this, rawValues);
    } catch (catchErr) {
      this.log.error(`Fehler im updateData-Ablauf: ${catchErr.message}`);
    }
  }
  onUnload(callback) {
    try {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = void 0;
        this.log.info("Polling-Intervall erfolgreich gestoppt.");
      }
      if (this.pump && typeof this.pump.disconnect === "function") {
        this.pump.disconnect();
      }
      this.log.info("Adapter wurde sauber beendet.");
      callback();
    } catch (err) {
      this.log.error(`Fehler beim Beenden des Adapters: ${err.message}`);
      callback();
    }
  }
  async onStateChange(id, state) {
    if (!state || state.ack) {
      if (!state) {
        this.log.info(`State ${id} wurde gel\xF6scht.`);
      }
      return;
    }
    this.log.info(`Nutzerbefehl empfangen f\xFCr ${id}: ${state.val}`);
    const mappingKey = id.split(".").pop();
    if (!mappingKey) {
      this.log.warn(`Ung\xFCltiger State-Schl\xFCssel aus ID extrahiert: ${id}`);
      return;
    }
    const definition = import_stateMapping.STATE_MAPPING[mappingKey];
    if (!definition) {
      this.log.warn(`Kein Mapping f\xFCr ${mappingKey} gefunden.`);
      return;
    }
    try {
      if (mappingKey === "Activate_Zip") {
        const zipOutState = await this.getStateAsync("Informationen.Ausgaenge.ZIPout");
        const isCurrentlyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;
        const targetVal = isCurrentlyRunning ? 0 : 1;
        const actionText = targetVal === 1 ? "Aktiviere" : "Deaktiviere";
        this.log.info(`Makro gestartet: ${actionText} ZIP Entl\xFCftung basierend auf ZIPout...`);
        await this.writePumpAsync("runDeaerate", targetVal);
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        await this.writePumpAsync("hotWaterCircPumpDeaerate", targetVal);
        this.log.info(`Makro erfolgreich: ZIP Entl\xFCftungsprogramm wurde auf ${targetVal} gesetzt.`);
        await this.setStateAsync(id, { val: targetVal, ack: true });
        await this.updateData();
        return;
      }
      if (!definition.luxWriteId || definition.write !== true) {
        this.log.warn(`Kein Schreib-Mapping f\xFCr ${mappingKey} vorhanden oder erlaubt.`);
        return;
      }
      if (typeof state.val === "number") {
        if (definition.min !== void 0 && state.val < definition.min) {
          this.log.warn(`Wert ${state.val} unterschreitet Minimum von ${definition.min}. Abgebrochen.`);
          return;
        }
        if (definition.max !== void 0 && state.val > definition.max) {
          this.log.warn(`Wert ${state.val} \xFCberschreitet Maximum von ${definition.max}. Abgebrochen.`);
          return;
        }
      }
      let valueToWrite = state.val;
      if (definition.role === "value.datetime") {
        const valStr = String(state.val).trim();
        const timeMatch = valStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
        const dateMatch = valStr.match(
          /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
        );
        if (timeMatch) {
          const hour = parseInt(timeMatch[1], 10);
          const minute = parseInt(timeMatch[2], 10);
          const second = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
          valueToWrite = hour * 3600 + minute * 60 + second;
        } else if (dateMatch) {
          const day = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10) - 1;
          const year = parseInt(dateMatch[3], 10);
          const hour = parseInt(dateMatch[4], 10);
          const minute = parseInt(dateMatch[5], 10);
          const second = dateMatch[6] ? parseInt(dateMatch[6], 10) : 0;
          const date = new Date(year, month, day, hour, minute, second);
          valueToWrite = Math.floor(date.getTime() / 1e3);
        } else if (/^\d+$/.test(valStr)) {
          valueToWrite = parseInt(valStr, 10);
        } else {
          this.log.error(
            `Ung\xFCltiges Format f\xFCr ${id}: ${state.val}. Erwartet wird "HH:MM" oder "TT.MM.JJJJ, HH:MM"`
          );
          return;
        }
      } else if (definition.factor && typeof state.val === "number") {
        valueToWrite = state.val * definition.factor;
      }
      const luxWriteId = definition.luxWriteId;
      const isRawWrite = definition.dataSource === "raw_parameter" || definition.dataSource === "raw_value" || !definition.dataSource && /^\d+$/.test(luxWriteId || "");
      if (isRawWrite && definition.unit === "\xB0C" && !definition.factor && typeof state.val === "number") {
        this.log.info(`Raw-Temperatur erkannt. Multipliziere Wert ${state.val} mit Faktor 10 f\xFCr Luxtronik.`);
        valueToWrite = state.val * 10;
      }
      if (isRawWrite) {
        const paramId = parseInt(luxWriteId, 10);
        this.log.info(`Sende RAW-NUMBER an Luxtronik: ID ${paramId} = ${valueToWrite}`);
        await this.writePumpAsync(paramId, valueToWrite, true);
      } else {
        this.log.info(`Sende STANDARD-STRING an Luxtronik: Name "${luxWriteId}" = ${valueToWrite}`);
        await this.writePumpAsync(luxWriteId, valueToWrite, false);
      }
      this.log.info(`Wert ${state.val} erfolgreich via [${luxWriteId}] an W\xE4rmepumpe \xFCbertragen.`);
      await this.setStateAsync(id, state.val, true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.updateData();
    } catch (err) {
      this.log.error(`Fehler bei der Befehlsausf\xFChrung: ${err.message}`);
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Lwd50a(options);
} else {
  (() => new Lwd50a())();
}
//# sourceMappingURL=main.js.map

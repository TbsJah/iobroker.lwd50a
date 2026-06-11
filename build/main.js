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
  /**
   * Wird aufgerufen, sobald der Adapter mit den ioBroker-Datenbanken verbunden ist.
   */
  async onReady() {
    const ip = this.config.host;
    const port = this.config.port || 8889;
    this.log.info(`Verbinde mit W\xE4rmepumpe auf ${ip}:${port}...`);
    this.pump = new luxtronik.createConnection(ip, port);
    await (0, import_virtualStates.initializeVirtualStates)(this);
    await this.updateData();
    await (0, import_virtualStates.initializeVirtualStates)(this);
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
  /**
   * Führt einen einmaligen, vollständigen Dump aller rohen Indizes und Werte
   * aus 3003 und 3004 in das ioBroker-Log aus.
   */
  async dumpAllRawToLog() {
    try {
      this.log.info("=======================================================");
      this.log.info("START COMPACT RAW DUMP: LISTE 3003 (PARAMETER)");
      this.log.info("=======================================================");
      const params = await this.readAllRaw(3003);
      for (let i = 0; i < params.length; i++) {
        this.log.info(`[RAW 3003] Index ${i.toString().padStart(3, " ")} = ${params[i]}`);
      }
      this.log.info(`--- ENDE LISTE 3003 (Insgesamt ${params.length} Indizes geloggt) ---`);
      this.log.info("=======================================================");
      this.log.info("START COMPACT RAW DUMP: LISTE 3004 (MESSWERTE)");
      this.log.info("=======================================================");
      const values = await this.readAllRaw(3004);
      for (let i = 0; i < values.length; i++) {
        this.log.info(`[RAW 3004] Index ${i.toString().padStart(3, " ")} = ${values[i]}`);
      }
      this.log.info(`--- ENDE LISTE 3004 (Insgesamt ${values.length} Indizes geloggt) ---`);
      this.log.info("=======================================================");
    } catch (err) {
      this.log.error(`Fehler beim Ausf\xFChren des Raw-Dumps: ${err.message}`);
    }
  }
  /**
   * Liest die komplette Liste (alle Parameter oder alle Messwerte) per TCP aus.
   *
   * @param command 3003 (Parameter) oder 3004 (Messwerte)
   */
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
  /**
   * Rechnet eine Sekundenzahl in das lesbare Format hh:mm:ss um.
   *
   * @param totalSeconds Die Sekunden als reine Zahl
   */
  formatSecondsToHMS(totalSeconds) {
    if (totalSeconds < 0 || isNaN(totalSeconds)) {
      return "00:00:00";
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  /**
   * Holt alle Daten von der Wärmepumpe ab und verteilt sie im ioBroker.
   * Konvertiert Sekunden automatisch in das lesbare hh:mm:ss Format.
   */
  async updateData() {
    if (!this.pump) {
      this.log.error("Abfrage abgebrochen: Keine aktive Verbindung zur W\xE4rmepumpe vorhanden.");
      return;
    }
    try {
      const rawParams = await this.readAllRaw(3003).catch((err) => {
        this.log.debug(`Raw-Parameter (3003) nicht verf\xFCgbar: ${err.message}`);
        return [];
      });
      const rawValues = await this.readAllRaw(3004).catch((err) => {
        this.log.debug(`Raw-Messwerte (3004) nicht verf\xFCgbar: ${err.message}`);
        return [];
      });
      this.pump.read(async (err, coolchipData) => {
        if (err) {
          if (err.message && err.message.toLowerCase().includes("busy")) {
            this.log.warn("W\xE4rmepumpe ist ausgelastet (busy). \xDCberspringe diesen Abfrage-Zyklus.");
            return;
          }
          this.log.error(`Verbindungsfehler beim Einlesen der Daten: ${err.message}`);
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
          const isRawNumber = /^\d+$/.test(luxId);
          let value = void 0;
          if (isRawNumber) {
            const index = parseInt(luxId, 10);
            if (definition.folder.startsWith("Einstellungen")) {
              if (rawParams && index < rawParams.length) {
                value = rawParams[index];
              }
            } else if (definition.folder.startsWith("Informationen")) {
              if (rawValues && index < rawValues.length) {
                value = rawValues[index];
              }
            }
            if (value !== void 0 && typeof value === "number" && definition.factor) {
              value = value / definition.factor;
            }
          } else {
            if (coolchipData.values && coolchipData.values[luxId] !== void 0) {
              value = coolchipData.values[luxId];
            } else if (coolchipData.parameters && coolchipData.parameters[luxId] !== void 0) {
              value = coolchipData.parameters[luxId];
            } else if (coolchipData.additional && coolchipData.additional[luxId] !== void 0) {
              value = coolchipData.additional[luxId];
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
        await (0, import_virtualStates.calculateTotalHours)(this);
        await (0, import_virtualStates.updateErrorHistory)(this, coolchipData.values.errors);
      });
    } catch (catchErr) {
      this.log.error(`Fehler im updateData-Ablauf: ${catchErr.message}`);
    }
  }
  /**
   * Wird aufgerufen, wenn der Adapter gestoppt oder neugestartet wird.
   *
   * @param callback Callback-Funktion, die aufgerufen werden muss, wenn das Beenden abgeschlossen ist.
   */
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
  /**
   * Verarbeitet vom Benutzer im ioBroker geänderte Werte und sendet sie an die Wärmepumpe.
   *
   * @param id Die ID des geänderten State
   * @param state Der neue State-Wert
   */
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
    if (mappingKey === "Activate_Zip") {
      const zipOutState = await this.getStateAsync("Informationen.Ausgaenge.ZIPout");
      const isCurrentlyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;
      const targetVal = isCurrentlyRunning ? 0 : 1;
      const actionText = targetVal === 1 ? "Aktiviere" : "Deaktiviere";
      this.log.info(`Makro gestartet: ${actionText} ZIP Entl\xFCftung basierend auf ZIPout...`);
      this.pump.write("runDeaerate", targetVal, async (err1) => {
        if (err1) {
          this.log.error(`Makro Fehler bei Schritt 1 (runDeaerate): ${err1.message}`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        this.pump.write("hotWaterCircPumpDeaerate", targetVal, async (err2) => {
          if (err2) {
            this.log.error(`Makro Fehler bei Schritt 2 (hotWaterCircPumpDeaerate): ${err2.message}`);
            return;
          }
          this.log.info(`Makro erfolgreich: ZIP Entl\xFCftungsprogramm wurde auf ${targetVal} gesetzt.`);
          await this.setState(id, { val: targetVal, ack: true });
          await this.updateData();
        });
      });
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
    if (definition.factor && typeof state.val === "number") {
      valueToWrite = state.val * definition.factor;
    }
    const luxWriteId = definition.luxWriteId;
    const isRawNumber = /^\d+$/.test(luxWriteId);
    if (isRawNumber && definition.unit === "\xB0C" && !definition.factor && typeof state.val === "number") {
      this.log.info(`Raw-Temperatur erkannt. Multipliziere Wert ${state.val} mit Faktor 10 f\xFCr Luxtronik.`);
      valueToWrite = state.val * 10;
    }
    const handleWriteResult = (err, _result) => {
      if (err) {
        this.log.error(`Fehler beim Schreiben an Luxtronik via [${luxWriteId}]: ${err.message}`);
        return;
      }
      this.log.info(`Wert ${state.val} erfolgreich via [${luxWriteId}] an W\xE4rmepumpe \xFCbertragen.`);
      this.setState(id, state.val, true).then(() => new Promise((resolve) => setTimeout(resolve, 500))).then(() => this.updateData()).catch((setStateErr) => {
        this.log.error(`Fehler beim Best\xE4tigen des Status im ioBroker: ${setStateErr.message}`);
      });
    };
    if (isRawNumber) {
      const paramId = parseInt(luxWriteId, 10);
      this.log.info(`Sende RAW-NUMBER an Luxtronik: ID ${paramId} = ${valueToWrite}`);
      this.pump.writeRaw(paramId, valueToWrite, handleWriteResult);
    } else {
      this.log.info(`Sende STANDARD-STRING an Luxtronik: Name "${luxWriteId}" = ${valueToWrite}`);
      this.pump.write(luxWriteId, valueToWrite, handleWriteResult);
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Lwd50a(options);
} else {
  (() => new Lwd50a())();
}
//# sourceMappingURL=main.js.map

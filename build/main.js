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
var import_rawFunctions = require("./rawFunctions");
var import_stateMapping = require("./stateMapping");
var import_virtualStates = require("./virtualStates");
class Lwd50a extends utils.Adapter {
  pollingInterval;
  pump;
  createdStates = /* @__PURE__ */ new Set();
  lastBzVal = "";
  zipTimer;
  isDebugLogActive = false;
  updateRunning = false;
  originalZipConfig = null;
  // Backup der Zirkulationstabelle
  constructor(options = {}) {
    super({
      ...options,
      name: "lwd50a"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.on("message", this.onMessage.bind(this));
  }
  /**
   * Sendet eine Telegram-Nachricht (wird nur bei echten Hardware-Fehlern der LWP aufgerufen)
   *
   * @param message Die Nachricht, die per Telegram versendet werden soll.
   */
  sendTelegramNotification(message) {
    const config = this.config;
    if (config.telegram_aktiv && config.telegram_instance) {
      const sendObj = {
        text: message
      };
      if (config.telegram_receiver && config.telegram_receiver.trim() !== "") {
        sendObj.user = config.telegram_receiver.trim();
      }
      this.sendTo(config.telegram_instance, "send", sendObj);
      if (this.isDebugLogActive) {
        this.log.debug(`Telegram-Warnung gesendet an ${config.telegram_instance}`);
      }
    }
  }
  async onMessage(obj) {
    if (obj.command === "sendTestError") {
      try {
        this.log.info("Test-Button empfangen!");
        const config = this.config;
        if (!config.telegram_aktiv || !config.telegram_instance) {
          if (obj.callback) {
            this.sendTo(
              obj.from,
              obj.command,
              { error: "Fehler: Bitte Konfiguration zuerst speichern!" },
              obj.callback
            );
          }
          return;
        }
        const lastErrorState = await this.getStateAsync((0, import_stateMapping.getDpPath)("Fehlerspeicher"));
        if (lastErrorState && lastErrorState.val) {
          this.sendTelegramNotification(`Test-Alarm: ${lastErrorState.val}`);
          this.log.info("Test-Fehlermeldung via Telegram versendet.");
          if (obj.callback) {
            this.sendTo(
              obj.from,
              obj.command,
              { result: "Nachricht erfolgreich an Telegram gesendet!" },
              obj.callback
            );
          }
        } else {
          if (obj.callback) {
            this.sendTo(
              obj.from,
              obj.command,
              { result: "Kein Fehler im Speicher gefunden. Es wurde nichts gesendet." },
              obj.callback
            );
          }
        }
      } catch (err) {
        this.log.error(`Fehler beim Test-Button: ${err.message}`);
        if (obj.callback) {
          this.sendTo(obj.from, obj.command, { error: `Skriptfehler: ${err.message}` }, obj.callback);
        }
      }
    }
  }
  async onReady() {
    const ip = this.config.host;
    const port = this.config.port || 8889;
    this.log.info(`Verbinde mit W\xE4rmepumpe auf ${ip}:${port}...`);
    this.pump = new luxtronik.createConnection(ip, port);
    await this.ensureAllObjectsExist();
    await (0, import_virtualStates.initializeVirtualStates)(this);
    const debugState = await this.getStateAsync((0, import_stateMapping.getDpPath)("Schreibe_Debug_Log"));
    this.isDebugLogActive = (debugState == null ? void 0 : debugState.val) === true;
    if (this.isDebugLogActive) {
      this.log.info("Synchronisiere Konfigurationswerte mit der W\xE4rmepumpe...");
    }
    await this.setIdleDefaults();
    const config = this.config;
    if (config.motionSensors && Array.isArray(config.motionSensors)) {
      for (const sensor of config.motionSensors) {
        if (sensor.oid && typeof sensor.oid === "string" && sensor.oid.trim() !== "") {
          this.subscribeForeignStates(sensor.oid.trim());
          if (this.isDebugLogActive) {
            this.log.info(`Bewegungssensor abonniert: ${sensor.name} (${sensor.oid})`);
          }
        }
      }
    }
    await this.updateData();
    let intervalSeconds = this.config.interval || 30;
    if (intervalSeconds < 10) {
      intervalSeconds = 10;
      this.log.warn("Eingestelltes Intervall war zu kurz. Wurde zum Schutz auf 10 Sekunden korrigiert.");
    }
    this.log.info(`Starte Polling-Intervall. Lese Daten und optimiere alle ${intervalSeconds} Sekunden.`);
    this.pollingInterval = setInterval(() => {
      void this.updateData();
    }, intervalSeconds * 1e3);
  }
  // =========================================================
  // SKRIPT-OPTIMIERUNG: HILFSFUNKTIONEN & SCHEDULE
  // =========================================================
  async ensureAllObjectsExist() {
    try {
      for (const [key, definition] of Object.entries(import_stateMapping.STATE_MAPPING)) {
        if (definition.isVirtual) {
          continue;
        }
        const stateId = `${definition.folder}.${key}`;
        if (!this.createdStates.has(stateId)) {
          await this.setObjectNotExistsAsync(definition.folder, {
            type: "channel",
            common: { name: definition.folder.split(".").pop() || definition.folder },
            native: {}
          });
          let targetType = definition.type === "json" ? "string" : definition.type;
          if (definition.unit === "s" && definition.type === "number") {
            targetType = "string";
          }
          await this.setObjectNotExistsAsync(stateId, {
            type: "state",
            common: {
              name: definition.name,
              type: targetType,
              role: definition.role,
              unit: definition.unit,
              read: true,
              write: definition.write || false,
              min: definition.min,
              max: definition.max,
              states: definition.states
            },
            native: {}
          });
          if (definition.write) {
            this.subscribeStates(stateId);
          }
          this.createdStates.add(stateId);
        }
      }
    } catch (err) {
      this.log.error(`Fehler bei der Vorab-Objekterzeugung: ${err.message}`);
    }
  }
  async syncConfigValue(mappingKey, val) {
    if (val === void 0 || val === null) {
      return;
    }
    const id = (0, import_stateMapping.getDpPath)(mappingKey);
    const state = await this.getStateAsync(id);
    if (!state || state.val !== val) {
      const definition = import_stateMapping.STATE_MAPPING[mappingKey];
      if (!definition) {
        return;
      }
      if (this.isDebugLogActive) {
        this.log.info(`Schreibe Wert direkt in W\xE4rmepumpe: ${mappingKey} = ${val}`);
      }
      if (definition.write === true && !definition.isVirtual && definition.luxWriteId) {
        let valueToWrite = val;
        if (definition.factor && typeof val === "number") {
          valueToWrite = val * definition.factor;
        }
        const isRawWrite = definition.dataSource === "raw_parameter" || definition.dataSource === "raw_value" || !definition.dataSource && /^\d+$/.test(definition.luxWriteId || "");
        if (isRawWrite && definition.unit === "\xB0C" && typeof val === "number" && !definition.factor) {
          valueToWrite = val * 10;
        }
        try {
          const writeId = isRawWrite ? parseInt(definition.luxWriteId, 10) : definition.luxWriteId;
          await this.queueWrite(writeId, valueToWrite, isRawWrite);
          await new Promise((r) => setTimeout(r, 200));
        } catch (err) {
          this.log.error(`Fehler beim Schreiben von ${mappingKey} an die Pumpe: ${err.message}`);
        }
      }
      await this.setState(id, { val, ack: true });
    }
  }
  async setOwnStateIfDifferent(id, val, ack = false) {
    try {
      if (val === void 0) {
        return;
      }
      const state = await this.getStateAsync(id);
      if (!state || state.val !== val) {
        await this.setState(id, { val, ack });
        if (this.isDebugLogActive) {
          this.log.debug(`Setze Werte f\xFCr ${id}: ${val}`);
        }
      }
    } catch (err) {
      this.log.error(`Fehler in setOwnStateIfDifferent f\xFCr ${id}: ${err.message}`);
    }
  }
  async setIdleDefaults() {
    var _a;
    try {
      const config = this.config;
      await this.syncConfigValue("heating_curve_end_point", config.endpunkt);
      await this.syncConfigValue("heating_curve_parallel_offset", config.fusspunkt);
      await this.syncConfigValue(
        "heating_system_circ_pump_voltage_minimal",
        config.sync_heating_system_circ_pump_voltage_minimal_heating
      );
      await this.syncConfigValue(
        "heating_system_circ_pump_voltage_nominal",
        config.sync_heating_system_circ_pump_voltage_nominal_heating
      );
      await this.syncConfigValue("warmwater_temperature", config.sync_warmwater_target_temperature);
      await this.syncConfigValue("hotWaterTemperatureHysteresis", config.sync_hotwater_temperature_hysteresis);
      await this.syncConfigValue("returnTemperatureHysteresis", config.sync_return_temperature_hysteresis);
      await this.syncConfigValue("zip_aktiv", config.zip_aktiv);
      await this.syncConfigValue("Heizen_nach_Wasser", (_a = config.Heating_after_warmwater) != null ? _a : false);
    } catch (err) {
      this.log.error(`Fehler beim Setzen der Leerlauf-Vorgabewerte: ${err.message}`);
    }
  }
  async restoreOriginalZipConfig() {
    if (!this.originalZipConfig) {
      return;
    }
    try {
      for (const [key, val] of Object.entries(this.originalZipConfig)) {
        if (val === null || val === void 0) {
          continue;
        }
        const def = import_stateMapping.STATE_MAPPING[key];
        let rawVal = val;
        if (def.role === "value.datetime" && typeof val === "string") {
          const timeMatch = val.match(/^(\d{1,2}):(\d{1,2})/);
          if (timeMatch) {
            rawVal = parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60;
          } else {
            rawVal = 0;
          }
        }
        const luxId = parseInt(def.luxWriteId, 10);
        await this.queueWrite(luxId, rawVal, true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.setState((0, import_stateMapping.getDpPath)(key), { val, ack: true });
      }
    } catch (err) {
      this.log.error(`Fehler bei der Wiederherstellung der ZIP Konfiguration: ${err.message}`);
    } finally {
      this.originalZipConfig = null;
    }
  }
  async stopZipAndDeaeration() {
    try {
      const activateZipState = await this.getStateAsync((0, import_stateMapping.getDpPath)("Activate_Zip"));
      const runDeaerateState = await this.getStateAsync((0, import_stateMapping.getDpPath)("runDeaerate"));
      const isZipActive = (activateZipState == null ? void 0 : activateZipState.val) === true || this.zipTimer || this.originalZipConfig !== null;
      const isDeaerateActive = (runDeaerateState == null ? void 0 : runDeaerateState.val) === 1 || (runDeaerateState == null ? void 0 : runDeaerateState.val) === true;
      if (isZipActive || isDeaerateActive) {
        if (this.isDebugLogActive) {
          this.log.info("Bedingungen erf\xFCllt: Stoppe aktives ZIP Makro und Entl\xFCftungsprogramm...");
        }
        if (this.zipTimer) {
          clearTimeout(this.zipTimer);
          this.zipTimer = void 0;
        }
        await this.restoreOriginalZipConfig();
        await this.queueWrite(158, 0, true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.queueWrite(684, 0, true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.syncConfigValue("runDeaerate", 0);
        await this.syncConfigValue("hotWaterCircPumpDeaerate", 0);
        await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Activate_Zip"), false, true);
      }
    } catch (err) {
      this.log.error(`Fehler beim Stoppen von ZIP/Entl\xFCftung: ${err.message}`);
    }
  }
  async istAnlageAelterAls10Min() {
    var _a;
    try {
      const state = await this.getStateAsync((0, import_stateMapping.getDpPath)("WP_BZ_akt"));
      const lastChange = (_a = state == null ? void 0 : state.lc) != null ? _a : 0;
      return (Date.now() - lastChange) / 6e4 >= 10;
    } catch {
      return false;
    }
  }
  async runOptimizationSchedule() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    try {
      const regelungAktiv = await this.getStateAsync((0, import_stateMapping.getDpPath)("Regelung_Aktiv"));
      if ((regelungAktiv == null ? void 0 : regelungAktiv.val) === false) {
        return;
      }
      const bzState = await this.getStateAsync((0, import_stateMapping.getDpPath)("WP_BZ_akt"));
      const bzVal = bzState && bzState.val !== null ? String(bzState.val).trim() : "";
      const istHeizen = bzVal === "0";
      const istWarmwasser = bzVal === "1";
      const istAbtauen = bzVal === "4";
      const istLeerlauf = bzVal === "5";
      if (!istHeizen && !istWarmwasser && !istLeerlauf && !istAbtauen) {
        return;
      }
      const config = this.config;
      if (bzVal !== this.lastBzVal) {
        if (istLeerlauf) {
          await this.setIdleDefaults();
        } else if (istHeizen) {
          await this.syncConfigValue("zip_aktiv", config.zip_aktiv);
          await this.syncConfigValue(
            "heating_system_circ_pump_voltage_minimal",
            config.sync_heating_system_circ_pump_voltage_minimal_heating
          );
          await this.syncConfigValue(
            "heating_system_circ_pump_voltage_nominal",
            config.sync_heating_system_circ_pump_voltage_nominal_heating
          );
          await this.syncConfigValue("Heizen_nach_Wasser", config.Heating_after_warmwater === true);
        } else if (istWarmwasser) {
          await this.syncConfigValue(
            "hotWaterTemperatureHysteresis",
            config.sync_hotwater_temperature_hysteresis
          );
          await this.syncConfigValue("zip_aktiv", config.zip_aktiv_ww);
          await this.syncConfigValue(
            "heating_system_circ_pump_voltage_minimal",
            config.sync_heating_system_circ_pump_voltage_minimal_water
          );
          await this.syncConfigValue(
            "heating_system_circ_pump_voltage_nominal",
            config.sync_heating_system_circ_pump_voltage_nominal_water
          );
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Activate_Zip"), true, false);
        } else if (istAbtauen) {
          await this.syncConfigValue("heating_system_circ_pump_voltage_nominal", 10);
        }
        this.lastBzVal = bzVal;
      }
      const [
        wwSollState,
        wwIstState,
        ruecklaufState,
        spreizungState,
        heatingStateStrState,
        vd1State,
        wwHystereseState,
        ruecklaufSollState,
        hupAktivState,
        heizenHystereseState,
        nachWasserState,
        aelterAls10
      ] = await Promise.all([
        this.getStateAsync((0, import_stateMapping.getDpPath)("Wamwassertemperatur_Soll")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("Wamwassertemperatur_Ist")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("temperature_return")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("spreizung_vorlauf_ruecklauf")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("opStateHeatingString")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("VD1out")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("hotWaterTemperatureHysteresis")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("temperature_target_return")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("HUPout")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("returnTemperatureHysteresis")),
        this.getStateAsync((0, import_stateMapping.getDpPath)("Heizen_nach_Wasser")),
        this.istAnlageAelterAls10Min()
      ]);
      const wwSoll = (_a = wwSollState == null ? void 0 : wwSollState.val) != null ? _a : 0;
      const wwIst = (_b = wwIstState == null ? void 0 : wwIstState.val) != null ? _b : 0;
      const ruecklauf = (_c = ruecklaufState == null ? void 0 : ruecklaufState.val) != null ? _c : 0;
      const spreizung = (_d = spreizungState == null ? void 0 : spreizungState.val) != null ? _d : 0;
      const heatingStateStr = String((heatingStateStrState == null ? void 0 : heatingStateStrState.val) || "").trim();
      const vd1 = (vd1State == null ? void 0 : vd1State.val) === 1;
      const wwHysterese = (_e = wwHystereseState == null ? void 0 : wwHystereseState.val) != null ? _e : 0;
      const ruecklaufSoll = (_f = ruecklaufSollState == null ? void 0 : ruecklaufSollState.val) != null ? _f : 0;
      const hupAktiv = (_g = hupAktivState == null ? void 0 : hupAktivState.val) != null ? _g : 0;
      const heizenHysterese = (_h = heizenHystereseState == null ? void 0 : heizenHystereseState.val) != null ? _h : 0;
      const nachWasser = nachWasserState == null ? void 0 : nachWasserState.val;
      const betriebsart = (_i = bzState == null ? void 0 : bzState.val) != null ? _i : 0;
      if (istHeizen) {
        if (aelterAls10 && vd1) {
          const fusspunkt = (_j = await this.getStateAsync((0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"))) == null ? void 0 : _j.val;
          if (fusspunkt === 35) {
            await this.syncConfigValue("heating_curve_parallel_offset", config.fusspunkt);
          }
        }
        if (spreizung < 6.5 && hupAktiv > 5.5) {
          await this.syncConfigValue("heating_system_circ_pump_voltage_nominal", hupAktiv - 0.25);
        } else if (spreizung > 7.5) {
          await this.syncConfigValue("heating_system_circ_pump_voltage_nominal", hupAktiv + 0.25);
        }
        if (ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
          if (aelterAls10) {
            await this.syncConfigValue("Heizen_nach_Wasser", false);
          }
        } else if (!nachWasser && config.Heating_after_warmwater === true) {
          await this.syncConfigValue("Heizen_nach_Wasser", true);
        }
        if (wwSoll - wwIst > 2 && ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
          await this.syncConfigValue("hotWaterTemperatureHysteresis", 2);
        }
      }
      if (istWarmwasser && nachWasser) {
        await this.syncConfigValue("heating_curve_parallel_offset", 35);
      }
      if (istLeerlauf) {
        if (wwIst <= wwSoll - wwHysterese || ruecklauf <= ruecklaufSoll - heizenHysterese) {
          await this.stopZipAndDeaeration();
        }
        if (wwSoll - wwIst >= wwHysterese - 1.5 && ruecklauf <= ruecklaufSoll && betriebsart !== 4 && heatingStateStr !== "Heizgrenze") {
          await this.syncConfigValue("heating_curve_parallel_offset", 35);
        }
      }
    } catch (err) {
      this.log.error(`Fehler im runOptimizationSchedule-Ablauf: ${err.message}`);
    }
  }
  readPumpAsync() {
    if (this.isDebugLogActive) {
      this.log.debug(`readPumpAsync Comand`);
    }
    return new Promise((resolve, reject) => {
      let isFinished = false;
      const timeout = setTimeout(() => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        reject(new Error("Timeout (35s): Luxtronik hat keine Antwort geliefert."));
      }, 35e3);
      this.pump.read((err, data) => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        clearTimeout(timeout);
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        } else {
          resolve(data);
        }
      });
    });
  }
  writePumpAsync(cmd, val, isRaw = false) {
    if (this.isDebugLogActive) {
      this.log.debug(`writePumpAsync Comand: ${cmd}, val: ${val}`);
    }
    return new Promise((resolve, reject) => {
      let isFinished = false;
      const timeout = setTimeout(() => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        reject(new Error(`Timeout (35s) beim Schreiben von [${cmd}].`));
      }, 35e3);
      const cb = (err) => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        clearTimeout(timeout);
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
  // Neue Hilfsvariable in der Klasse
  writeQueue = [];
  isWriting = false;
  async queueWrite(cmd, val, isRaw) {
    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        try {
          await this.writePumpAsync(cmd, val, isRaw);
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
      void this.processQueue();
    });
  }
  async processQueue() {
    if (this.isWriting || this.writeQueue.length === 0) {
      return;
    }
    this.isWriting = true;
    const task = this.writeQueue.shift();
    if (task) {
      await task();
    }
    this.isWriting = false;
    void this.processQueue();
  }
  // In onStateChange oder setIdleDefaults dann queueWrite statt writePumpAsync nutzen:
  // await this.queueWrite(cmd, valueToWrite, isRawWrite);
  formatSecondsToHMS(totalSeconds) {
    if (totalSeconds < 0 || isNaN(totalSeconds)) {
      return "00:00:00";
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  errorCount = 0;
  MAX_ERRORS = 3;
  async updateData() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (this.updateRunning) {
      return;
    }
    this.updateRunning = true;
    try {
      let rawParams = [];
      let rawValues = [];
      let coolchipData = null;
      try {
        rawParams = await (0, import_rawFunctions.readAllRaw)(this, 3003);
      } catch (err) {
        this.log.debug(`Raw 3003 Fehler: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 3500));
      try {
        rawValues = await (0, import_rawFunctions.readAllRaw)(this, 3004);
      } catch (err) {
        this.log.debug(`Raw 3004 Fehler: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 3500));
      try {
        coolchipData = await this.readPumpAsync();
      } catch (err) {
        if (err.message.includes("Timeout")) {
          this.log.debug("W\xE4rmepumpe ausgelastet (Timeout). Der Abfrage-Zyklus wird \xFCbersprungen.");
        } else {
          this.log.error(`Verbindungsfehler zur W\xE4rmepumpe: ${err.message}`);
        }
      }
      if (!coolchipData) {
        return;
      }
      this.errorCount = 0;
      await this.setState("Info.connection", true, true);
      const statePromises = [];
      for (const [key, definition] of Object.entries(import_stateMapping.STATE_MAPPING)) {
        if (definition.isVirtual) {
          continue;
        }
        const config = this.config;
        if (config[`sync_${key}`] === false) {
          continue;
        }
        const luxId = definition.luxWriteId || key;
        let value = void 0;
        if (definition.dataSource) {
          switch (definition.dataSource) {
            case "raw_parameter":
              value = rawParams == null ? void 0 : rawParams[parseInt(luxId, 10)];
              if (value !== void 0 && definition.factor) {
                value /= definition.factor;
              }
              break;
            case "raw_value":
              value = rawValues == null ? void 0 : rawValues[parseInt(luxId, 10)];
              if (value !== void 0 && definition.factor) {
                value /= definition.factor;
              }
              break;
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
          if (/^\d+$/.test(luxId)) {
            const idx = parseInt(luxId, 10);
            value = definition.folder.startsWith("Einstellungen") ? rawParams == null ? void 0 : rawParams[idx] : rawValues == null ? void 0 : rawValues[idx];
            if (value !== void 0 && definition.factor) {
              value /= definition.factor;
            }
          } else {
            value = (_h = (_f = (_d = coolchipData == null ? void 0 : coolchipData.values) == null ? void 0 : _d[luxId]) != null ? _f : (_e = coolchipData == null ? void 0 : coolchipData.parameters) == null ? void 0 : _e[luxId]) != null ? _h : (_g = coolchipData == null ? void 0 : coolchipData.additional) == null ? void 0 : _g[luxId];
          }
        }
        if (value !== void 0) {
          if (definition.type === "number" && typeof value === "string") {
            value = value.toLowerCase() === "ein" ? 1 : value.toLowerCase() === "aus" ? 0 : parseFloat(value);
          } else if (definition.type === "boolean") {
            value = value === true || value === 1 || String(value).toLowerCase() === "ein" || String(value).toLowerCase() === "true";
          } else if (definition.type === "json" && typeof value === "object") {
            value = JSON.stringify(value);
          }
          if (definition.unit === "s" && typeof value === "number") {
            value = this.formatSecondsToHMS(value);
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
            }
          }
          const stateId = `${definition.folder}.${key}`;
          statePromises.push(this.setStateChangedAsync(stateId, { val: value, ack: true }));
        }
      }
      await Promise.all(statePromises);
      await (0, import_virtualStates.calculateTotalThermalEnergy)(this);
      await (0, import_virtualStates.calculateTotalEnergy)(this);
      const fehlerDp = (0, import_stateMapping.getDpPath)("Fehlerspeicher");
      const oldFehlerState = await this.getStateAsync(fehlerDp);
      const oldFehlerVal = oldFehlerState == null ? void 0 : oldFehlerState.val;
      await (0, import_virtualStates.updateErrorHistory)(this, rawValues);
      const newFehlerState = await this.getStateAsync(fehlerDp);
      const newFehlerVal = newFehlerState == null ? void 0 : newFehlerState.val;
      if (newFehlerVal && newFehlerVal !== oldFehlerVal) {
        try {
          const oldList = oldFehlerVal ? JSON.parse(oldFehlerVal) : [];
          const newList = JSON.parse(newFehlerVal);
          if (newList.length > 0) {
            const newestError = newList[0];
            const oldNewestError = oldList.length > 0 ? oldList[0] : null;
            if (!oldNewestError || newestError.timestamp !== oldNewestError.timestamp) {
              const msg = `\u{1F6A8} *St\xF6rung W\xE4rmepumpe!*
Ein Fehler an der W\xE4rmepumpe wurde registriert:

*Code:* ${newestError.code}
*Fehler:* ${newestError.beschreibung}
*Datum:* ${newestError.datum}`;
              this.sendTelegramNotification(msg);
              this.log.warn(`Neuer W\xE4rmepumpen-Fehler gemeldet: ${newestError.beschreibung}`);
            }
          }
        } catch {
          this.log.debug("Konnte Fehlerhistorie f\xFCr Telegram nicht parsen.");
        }
      }
      await (0, import_virtualStates.updateOutageHistory)(this, rawValues);
      await (0, import_virtualStates.calculateTemperatureSpread)(this);
      await this.runOptimizationSchedule();
    } catch (err) {
      this.errorCount++;
      this.log.error(`Abfragefehler (${this.errorCount}/${this.MAX_ERRORS}): ${err.message}`);
      if (this.errorCount >= this.MAX_ERRORS) {
        await this.setState("Info.connection", false, true);
        this.log.warn("W\xE4rmepumpe nicht erreichbar. Verbindung wurde als unterbrochen markiert.");
        this.sendTelegramNotification(
          "W\xE4rmepumpe nicht erreichbar. Verbindung wurde als unterbrochen markiert."
        );
      }
    } finally {
      this.updateRunning = false;
    }
  }
  onUnload(callback) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.pump && typeof this.pump.disconnect === "function") {
      this.pump.disconnect();
    }
    if (this.zipTimer) {
      clearTimeout(this.zipTimer);
    }
    callback();
  }
  async onStateChange(id, state) {
    if (!state) {
      return;
    }
    const config = this.config;
    if (config.motion_sensors_aktiv && config.motionSensors && Array.isArray(config.motionSensors)) {
      const matchedSensor = config.motionSensors.find((s) => s.oid && s.oid.trim() === id);
      if (matchedSensor && state.val === true) {
        const now = Date.now();
        const zipOutState = await this.getStateAsync((0, import_stateMapping.getDpPath)("ZIPout"));
        const lastZipChange = (zipOutState == null ? void 0 : zipOutState.lc) || 0;
        if (now - lastZipChange > (config.zip_last_run_min || 600) * 1e3) {
          if (this.isDebugLogActive) {
            this.log.debug(
              `Bewegung an '${matchedSensor.name || id}' erkannt. Letzte ZIP-Aktion ist alt genug. Triggere ZIP Makro.`
            );
          }
          await this.setState((0, import_stateMapping.getDpPath)("Activate_Zip"), { val: true, ack: false });
        } else {
          if (this.isDebugLogActive) {
            this.log.debug(
              `Bewegung an '${matchedSensor.name || id}' erkannt, aber ZIP hat k\xFCrzlich gearbeitet.`
            );
          }
        }
        return;
      }
    } else {
      if (this.isDebugLogActive && config.motion_sensors_aktiv === false) {
        this.log.debug(`Bewegungssensoren sind in der Konfiguration deaktiviert.`);
      }
    }
    if (state.ack) {
      return;
    }
    const mappingKey = id.split(".").pop();
    if (!mappingKey) {
      return;
    }
    const definition = import_stateMapping.STATE_MAPPING[mappingKey];
    if (!definition) {
      return;
    }
    try {
      if (mappingKey === "Schreibe_Debug_Log") {
        this.isDebugLogActive = state.val === true;
        await this.setState(id, { val: state.val, ack: true });
        return;
      }
      if (mappingKey === "Regelung_Aktiv" || mappingKey === "zip_aktiv") {
        await this.setState(id, { val: state.val, ack: true });
        return;
      }
      if (mappingKey === "Setze_Vorgabewerte" && state.val === true) {
        await this.setIdleDefaults();
        await this.setState(id, { val: false, ack: true });
        return;
      }
      if (mappingKey === "Dump_Raw_To_Log" && state.val === true) {
        await (0, import_rawFunctions.dumpAllRawToLog)(this);
        await this.setState(id, { val: false, ack: true });
        return;
      }
      if (mappingKey === "Activate_Zip") {
        if (state.val === true) {
          const durationState = await this.getStateAsync((0, import_stateMapping.getDpPath)("zip_aktiv"));
          const durationSeconds = durationState && typeof durationState.val === "number" ? durationState.val : 120;
          if (durationSeconds <= 0) {
            await this.setState(id, { val: false, ack: true });
            return;
          }
          const bzState = await this.getStateAsync((0, import_stateMapping.getDpPath)("WP_BZ_akt"));
          const bzVal = bzState ? Number(bzState.val) : 5;
          const [wwIstS, wwSollS, wwHystS, rLState, rSollState, hzHystState] = await Promise.all([
            this.getStateAsync((0, import_stateMapping.getDpPath)("Wamwassertemperatur_Ist")),
            this.getStateAsync((0, import_stateMapping.getDpPath)("Wamwassertemperatur_Soll")),
            this.getStateAsync((0, import_stateMapping.getDpPath)("hotWaterTemperatureHysteresis")),
            this.getStateAsync((0, import_stateMapping.getDpPath)("temperature_return")),
            this.getStateAsync((0, import_stateMapping.getDpPath)("temperature_target_return")),
            this.getStateAsync((0, import_stateMapping.getDpPath)("returnTemperatureHysteresis"))
          ]);
          const useDeaeration = bzVal === 5 && Number(wwIstS == null ? void 0 : wwIstS.val) > Number(wwSollS == null ? void 0 : wwSollS.val) - Number(wwHystS == null ? void 0 : wwHystS.val) && Number(rLState == null ? void 0 : rLState.val) > Number(rSollState == null ? void 0 : rSollState.val) - Number(hzHystState == null ? void 0 : hzHystState.val);
          if (this.zipTimer) {
            clearTimeout(this.zipTimer);
            this.zipTimer = void 0;
          }
          if (useDeaeration) {
            await this.queueWrite(158, 1, true);
            await new Promise((r) => setTimeout(r, 100));
            await this.queueWrite(684, 1, true);
            await this.syncConfigValue("runDeaerate", 1);
            await this.syncConfigValue("hotWaterCircPumpDeaerate", 1);
          } else {
            const onTimeMinutes = Math.ceil(durationSeconds / 60);
            if (!this.originalZipConfig) {
              const keysToSave = [
                "hotWaterCircPumpTimerTableSelected",
                "WW_MoSo_Start1",
                "WW_MoSo_End1",
                "WW_MoSo_Start2",
                "WW_MoSo_End2",
                "WW_MoSo_Start3",
                "WW_MoSo_End3",
                "WW_MoSo_Start4",
                "WW_MoSo_End4",
                "WW_MoSo_Start5",
                "WW_MoSo_End5",
                "hotWaterCircPumpOnTime",
                "hotWaterCircPumpOffTime"
              ];
              this.originalZipConfig = {};
              for (const k of keysToSave) {
                const s = await this.getStateAsync((0, import_stateMapping.getDpPath)(k));
                this.originalZipConfig[k] = s ? s.val : null;
              }
            }
            const updates = [
              { key: "hotWaterCircPumpTimerTableSelected", raw: 0 },
              { key: "WW_MoSo_Start1", raw: 0 },
              { key: "WW_MoSo_End1", raw: 86340 },
              { key: "WW_MoSo_Start2", raw: 0 },
              { key: "WW_MoSo_End2", raw: 0 },
              { key: "hotWaterCircPumpOnTime", raw: onTimeMinutes },
              { key: "hotWaterCircPumpOffTime", raw: 60 }
            ];
            for (const u of updates) {
              await this.queueWrite(parseInt(import_stateMapping.STATE_MAPPING[u.key].luxWriteId, 10), u.raw, true);
              await new Promise((r) => setTimeout(r, 100));
            }
          }
          await this.setState(id, { val: true, ack: true });
          this.zipTimer = setTimeout(async () => {
            await this.stopZipAndDeaeration();
          }, durationSeconds * 1e3);
        } else {
          await this.stopZipAndDeaeration();
        }
        return;
      }
      if (!definition.luxWriteId || definition.write !== true) {
        return;
      }
      let valueToWrite = state.val;
      if (definition.role === "value.datetime") {
        const valStr = String(state.val).trim();
        const timeMatch = valStr.match(/^(\d{1,2}):(\d{1,2})/);
        if (timeMatch) {
          valueToWrite = parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60;
        }
      } else if (definition.factor && typeof state.val === "number") {
        valueToWrite = state.val * definition.factor;
      }
      const isRawWrite = definition.dataSource === "raw_parameter" || definition.dataSource === "raw_value" || !definition.dataSource && /^\d+$/.test(definition.luxWriteId || "");
      if (isRawWrite && definition.unit === "\xB0C" && typeof state.val === "number" && !definition.factor) {
        valueToWrite = state.val * 10;
      }
      await this.queueWrite(
        isRawWrite ? parseInt(definition.luxWriteId, 10) : definition.luxWriteId,
        valueToWrite,
        isRawWrite
      );
      await this.setState(id, { val: state.val, ack: true });
    } catch (err) {
      this.log.error(`Fehler bei Befehlsausf\xFChrung: ${err.message}`);
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Lwd50a(options);
} else {
  (() => new Lwd50a())();
}
//# sourceMappingURL=main.js.map

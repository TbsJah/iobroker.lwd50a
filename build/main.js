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
  }
  async onReady() {
    const ip = this.config.host;
    const port = this.config.port || 8889;
    this.log.info(`Verbinde mit W\xE4rmepumpe auf ${ip}:${port}...`);
    this.pump = new luxtronik.createConnection(ip, port);
    await (0, import_virtualStates.initializeVirtualStates)(this);
    const debugState = await this.getStateAsync((0, import_stateMapping.getDpPath)("Schreibe_Debug_Log"));
    this.isDebugLogActive = (debugState == null ? void 0 : debugState.val) === true;
    const sensorKeys = ["ZIP_Bewegung_Pfad_1", "ZIP_Bewegung_Pfad_2", "ZIP_Bewegung_Pfad_3"];
    for (const key of sensorKeys) {
      const s = await this.getStateAsync((0, import_stateMapping.getDpPath)(key));
      if (s && s.val && typeof s.val === "string" && s.val.length > 0) {
        this.subscribeForeignStates(s.val);
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
  /**
   * Setzt einen eigenen State synchron via setState, wenn der Wert abweicht.
   *
   * @param id - Die Objekt-ID des zu setzenden States
   * @param val - Der neue Wert, der gesetzt werden soll
   * @param ack - Acknowledged-Flag (true, wenn von Gerät bestätigt)
   */
  async setOwnStateIfDifferent(id, val, ack = false) {
    try {
      if (val === void 0) {
        return;
      }
      const state = await this.getStateAsync(id);
      if (!state || state.val !== val) {
        await this.setState(id, { val, ack });
        if (this.isDebugLogActive) {
          this.log.info(`Setze Werte f\xFCr ${id}: ${val}`);
        }
      }
    } catch (err) {
      this.log.error(`Fehler in setOwnStateIfDifferent f\xFCr ${id}: ${err.message}`);
    }
  }
  /**
   * Setzt alle Anlageparameter auf die Standardwerte (Leerlauf) aus der Instanzkonfiguration zurück.
   */
  async setIdleDefaults() {
    try {
      const configWithDynamicKeys = this.config;
      await this.setOwnStateIfDifferent(
        (0, import_stateMapping.getDpPath)("heating_curve_end_point"),
        configWithDynamicKeys.endpunkt,
        false
      );
      await this.setOwnStateIfDifferent(
        (0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"),
        configWithDynamicKeys.fusspunkt,
        false
      );
      await this.setOwnStateIfDifferent(
        (0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_minimal"),
        configWithDynamicKeys.sync_heating_system_circ_pump_voltage_minimal,
        false
      );
      await this.setOwnStateIfDifferent(
        (0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_nominal"),
        configWithDynamicKeys.sync_heating_system_circ_pump_voltage_nominal,
        false
      );
      await this.setOwnStateIfDifferent(
        (0, import_stateMapping.getDpPath)("warmwater_temperature"),
        configWithDynamicKeys.sync_warmwater_target_temperature,
        false
      );
      await this.setOwnStateIfDifferent(
        (0, import_stateMapping.getDpPath)("hotWaterTemperatureHysteresis"),
        configWithDynamicKeys.sync_hotwater_temperature_hysteresis,
        false
      );
      await this.setOwnStateIfDifferent(
        (0, import_stateMapping.getDpPath)("returnTemperatureHysteresis"),
        configWithDynamicKeys.sync_return_temperature_hysteresis,
        false
      );
      await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("zip_aktiv"), configWithDynamicKeys.zip_aktiv, false);
      await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Heizen_nach_Wasser"), false, true);
    } catch (err) {
      this.log.error(`Fehler beim Setzen der Leerlauf-Vorgabewerte: ${err.message}`);
    }
  }
  /**
   * Stellt die gesicherte ZIP Zirkulationstabelle wieder her.
   */
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
        await this.writePumpAsync(luxId, rawVal, true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.setState((0, import_stateMapping.getDpPath)(key), { val, ack: true });
      }
    } catch (err) {
      this.log.error(`Fehler bei der Wiederherstellung der ZIP Konfiguration: ${err.message}`);
    } finally {
      this.originalZipConfig = null;
    }
  }
  /**
   * Prüft, ob das ZIP-Makro oder das Entlüftungsprogramm noch läuft und beendet es sicher.
   */
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
        await this.writePumpAsync(158, 0, true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.writePumpAsync(684, 0, true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("runDeaerate"), 0, true);
        await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("hotWaterCircPumpDeaerate"), 0, true);
        await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Activate_Zip"), false, true);
      }
    } catch (err) {
      this.log.error(`Fehler beim Stoppen von ZIP/Entl\xFCftung: ${err.message}`);
    }
  }
  /**
   * Prüft, ob der letzte Wechsel des Anlagenstatus länger als 10 Minuten her ist.
   */
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
  /**
   * Führt die Überwachung und dynamische Anpassung der Heizkurve/HUP aus.
   */
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
      if (bzVal !== this.lastBzVal) {
        if (this.lastBzVal === "") {
          this.lastBzVal = bzVal;
        } else {
          const config = this.config;
          if (istLeerlauf) {
            await this.setIdleDefaults();
          } else if (istHeizen) {
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("zip_aktiv"), config.zip_aktiv, false);
            await this.setOwnStateIfDifferent(
              (0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_minimal"),
              config.sync_heating_system_circ_pump_voltage_minimal,
              false
            );
            await this.setOwnStateIfDifferent(
              (0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_nominal"),
              config.sync_heating_system_circ_pump_voltage_nominal,
              false
            );
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Heizen_nach_Wasser"), true, true);
          } else if (istWarmwasser) {
            await this.setOwnStateIfDifferent(
              (0, import_stateMapping.getDpPath)("hotWaterTemperatureHysteresis"),
              config.hysterese_ww,
              false
            );
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("zip_aktiv"), config.zip_aktiv_ww, false);
            await this.setOwnStateIfDifferent(
              (0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_nominal"),
              10,
              false
            );
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Activate_Zip"), true, false);
          } else if (istAbtauen) {
            await this.setOwnStateIfDifferent(
              (0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_nominal"),
              10,
              false
            );
          }
          this.lastBzVal = bzVal;
        }
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
            const config = this.config;
            await this.setOwnStateIfDifferent(
              (0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"),
              config.fusspunkt,
              false
            );
          }
        }
        if (spreizung < 6.5 && hupAktiv > 5.5) {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("HUPout"), hupAktiv - 0.25, false);
        } else if (spreizung > 7.5) {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("HUPout"), hupAktiv + 0.25, false);
        }
        if (ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
          if (aelterAls10) {
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Heizen_nach_Wasser"), false, true);
          }
        } else if (!nachWasser) {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Heizen_nach_Wasser"), true, true);
        }
        if (wwSoll - wwIst > 2 && ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("hotWaterTemperatureHysteresis"), 2, false);
        }
      }
      if (istWarmwasser && nachWasser) {
        await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"), 35, false);
      }
      if (istLeerlauf) {
        if (wwIst <= wwSoll - wwHysterese || ruecklauf <= ruecklaufSoll - heizenHysterese) {
          await this.stopZipAndDeaeration();
        }
        if (wwSoll - wwIst >= wwHysterese - 1.5 && ruecklauf <= ruecklaufSoll && betriebsart !== 4 && heatingStateStr !== "Heizgrenze") {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"), 35, false);
        }
      }
    } catch (err) {
      this.log.error(`Fehler im runOptimizationSchedule-Ablauf: ${err.message}`);
    }
  }
  readPumpAsync() {
    if (this.isDebugLogActive) {
      this.log.info(`readPumpAsync Comand`);
    }
    return new Promise((resolve, reject) => {
      let isFinished = false;
      const timeout = setTimeout(() => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        reject(new Error("Timeout (25s): Luxtronik hat keine Antwort geliefert."));
      }, 25e3);
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
      this.log.info(`writePumpAsync Comand: ${cmd}, val: ${val}`);
    }
    return new Promise((resolve, reject) => {
      let isFinished = false;
      const timeout = setTimeout(() => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        reject(new Error(`Timeout (10s) beim Schreiben von [${cmd}].`));
      }, 25e3);
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
  /**
   * Konvertiert reine Sekunden in das Format HH:MM:SS
   *
   * @param totalSeconds Die Anzahl der Sekunden, die formatiert werden sollen.
   */
  formatSecondsToHMS(totalSeconds) {
    if (totalSeconds < 0 || isNaN(totalSeconds)) {
      return "00:00:00";
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
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
      await new Promise((r) => setTimeout(r, 1500));
      try {
        rawValues = await (0, import_rawFunctions.readAllRaw)(this, 3004);
      } catch (err) {
        this.log.debug(`Raw 3004 Fehler: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 1500));
      try {
        coolchipData = await this.readPumpAsync();
      } catch (err) {
        if (err.message.includes("Timeout")) {
          this.log.warn("W\xE4rmepumpe ausgelastet (Timeout). Der Abfrage-Zyklus wird \xFCbersprungen.");
        } else {
          this.log.error(`Verbindungsfehler: ${err.message}`);
        }
      }
      if (!coolchipData) {
        return;
      }
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
          let targetType = definition.type === "json" ? "string" : definition.type;
          if (definition.unit === "s" && typeof value === "number") {
            value = this.formatSecondsToHMS(value);
            targetType = "string";
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
            }
          }
          const stateId = `${definition.folder}.${key}`;
          if (!this.createdStates.has(stateId)) {
            await this.setObjectNotExistsAsync(definition.folder, {
              type: "channel",
              common: { name: definition.folder.split(".").pop() || definition.folder },
              native: {}
            });
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
          await this.setState(stateId, { val: value, ack: true });
        }
      }
      await (0, import_virtualStates.calculateTotalThermalEnergy)(this);
      await (0, import_virtualStates.calculateTotalEnergy)(this);
      await (0, import_virtualStates.updateErrorHistory)(this, rawValues);
      await (0, import_virtualStates.updateOutageHistory)(this, rawValues);
      await (0, import_virtualStates.calculateTemperatureSpread)(this);
      await this.runOptimizationSchedule();
    } catch (err) {
      this.log.error(`Fehler im updateData-Ablauf: ${err.message}`);
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
    const sensorKeys = ["ZIP_Bewegung_Pfad_1", "ZIP_Bewegung_Pfad_2", "ZIP_Bewegung_Pfad_3"];
    for (const key of sensorKeys) {
      const pathState = await this.getStateAsync((0, import_stateMapping.getDpPath)(key));
      const path = pathState == null ? void 0 : pathState.val;
      if (path && path.length > 0 && id === path && state.val === true) {
        const now = Date.now();
        const zipOutState = await this.getStateAsync((0, import_stateMapping.getDpPath)("ZIPout"));
        const lastZipChange = (zipOutState == null ? void 0 : zipOutState.lc) || 0;
        const configWithDynamicKeys = this.config;
        if (now - lastZipChange > configWithDynamicKeys.zip_last_run_min * 1e3) {
          if (this.isDebugLogActive) {
            this.log.info(
              `Bewegung an ${path} erkannt. Letzte ZIP-Aktion (Hardware) ist \xFCber 10 Min her. Triggere ZIP Makro.`
            );
          }
          await this.setState((0, import_stateMapping.getDpPath)("Activate_Zip"), { val: true, ack: false });
        } else {
          if (this.isDebugLogActive) {
            this.log.debug(
              `Bewegung an ${path} erkannt, aber ZIP hat in den letzten 10 Minuten bereits gearbeitet.`
            );
          }
        }
        return;
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
      if (mappingKey === "Regelung_Aktiv" || mappingKey === "zip_aktiv" || mappingKey.startsWith("ZIP_Bewegung_Pfad_")) {
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
            await this.writePumpAsync(158, 1, true);
            await new Promise((r) => setTimeout(r, 100));
            await this.writePumpAsync(684, 1, true);
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("runDeaerate"), 1, true);
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("hotWaterCircPumpDeaerate"), 1, true);
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
              await this.writePumpAsync(parseInt(import_stateMapping.STATE_MAPPING[u.key].luxWriteId, 10), u.raw, true);
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
      await this.writePumpAsync(
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

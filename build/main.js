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
    this.pump = luxtronik.createConnection(ip, port);
    await (0, import_virtualStates.initializeVirtualStates)(this);
    const debugState = await this.getStateAsync((0, import_stateMapping.getDpPath)("Schreibe_Debug_Log"));
    this.isDebugLogActive = (debugState == null ? void 0 : debugState.val) === true;
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
   * Setzt einen eigenen State nur, wenn der Wert abweicht oder noch nicht existiert.
   * Verhindert unnötige Schreibbefehle (Traffic) an die Datenbank.
   *
   * @param id Die ID des zu setzenden States.
   * @param val Der neue Wert.
   * @param ack Ob der Wert als bestätigt gesetzt werden soll.
   */
  async setOwnStateIfDifferent(id, val, ack = false) {
    try {
      if (val === void 0) {
        return;
      }
      const state = await this.getStateAsync(id);
      if (!state || state.val !== val) {
        await this.setStateAsync(id, { val, ack });
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
      if (this.isDebugLogActive) {
        this.log.debug(`Setze Wert f\xFCr endpunkt: ${configWithDynamicKeys.endpunkt}`);
        this.log.debug(`Setze Fusspunkt: ${configWithDynamicKeys.fusspunkt}`);
      }
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
   * Wird automatisch am Ende von updateData() aufgerufen.
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
        if (this.isDebugLogActive) {
          this.log.debug(
            `Betriebsmodus gewechselt von '${this.lastBzVal}' zu '${bzVal}'. Keine Optimierung vorgesehen. \xDCberspringe.`
          );
        }
        return;
      }
      if (bzVal !== this.lastBzVal) {
        if (this.isDebugLogActive) {
          this.log.debug(
            `Betriebsmodus gewechselt von '${this.lastBzVal}' zu '${bzVal}'. Setze Vorgabewerte...`
          );
        }
        const configWithDynamicKeys = this.config;
        if (istLeerlauf) {
          await this.setIdleDefaults();
        } else if (istHeizen) {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("zip_aktiv"), configWithDynamicKeys.zip_aktiv, false);
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
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Heizen_nach_Wasser"), true, true);
        } else if (istWarmwasser) {
          await this.setOwnStateIfDifferent(
            (0, import_stateMapping.getDpPath)("hotWaterTemperatureHysteresis"),
            configWithDynamicKeys.hysterese_ww,
            false
          );
          await this.setOwnStateIfDifferent(
            (0, import_stateMapping.getDpPath)("zip_aktiv"),
            configWithDynamicKeys.zip_aktiv_ww,
            false
          );
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_nominal"), 10, false);
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Activate_Zip"), true, false);
        } else if (istAbtauen) {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("heating_system_circ_pump_voltage_nominal"), 10, false);
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
            const configWithDynamicKeys = this.config;
            await this.setOwnStateIfDifferent(
              (0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"),
              configWithDynamicKeys.fusspunkt,
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
        } else {
          if (!nachWasser) {
            await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("Heizen_nach_Wasser"), true, true);
          }
        }
        if (wwSoll - wwIst > 2 && ruecklauf >= ruecklaufSoll + heizenHysterese - 0.1) {
          if (this.isDebugLogActive) {
            this.log.debug("Starte WW Erzeugung nach Heizung");
          }
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("hotWaterTemperatureHysteresis"), 2, false);
        }
      }
      if (istWarmwasser) {
        if (nachWasser) {
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"), 35, false);
        }
      }
      if (istLeerlauf) {
        if (wwSoll - wwIst >= wwHysterese - 1.5 && ruecklauf <= ruecklaufSoll && betriebsart !== 4 && heatingStateStr !== "Heizgrenze") {
          if (this.isDebugLogActive) {
            this.log.debug(
              `Setze 35 Grad Fu\xDFpunkt: WW-Soll (${wwSoll}) - WW-Ist (${wwIst}) >= Hysterese (${wwHysterese}) - 1.5 UND R\xFCcklauf (${ruecklauf}) <= Soll (${ruecklaufSoll})`
            );
          }
          await this.setOwnStateIfDifferent((0, import_stateMapping.getDpPath)("heating_curve_parallel_offset"), 35, false);
        }
      }
    } catch (err) {
      this.log.error(`Fehler im runOptimizationSchedule-Ablauf: ${err.message}`);
    }
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (this.updateRunning) {
      this.log.debug("Polling \xFCbersprungen - letzter Zyklus l\xE4uft noch.");
      return;
    }
    if (!this.pump) {
      this.log.error("Abfrage abgebrochen: Keine aktive Verbindung zur W\xE4rmepumpe vorhanden.");
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
        this.log.debug(`Raw-Parameter (3003) nicht verf\xFCgbar: ${err.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        rawValues = await (0, import_rawFunctions.readAllRaw)(this, 3004);
      } catch (err) {
        this.log.debug(`Raw-Messwerte (3004) nicht verf\xFCgbar: ${err.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        coolchipData = await this.readPumpAsync();
      } catch (err) {
        if ((_a = err.message) == null ? void 0 : _a.toLowerCase().includes("busy")) {
          this.log.warn("W\xE4rmepumpe ist ausgelastet (busy). \xDCberspringe diesen Abfrage-Zyklus.");
        } else {
          this.log.error(`Verbindungsfehler beim Einlesen der Daten: ${err.message}`);
        }
      }
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
              value = (_b = coolchipData == null ? void 0 : coolchipData.parameters) == null ? void 0 : _b[luxId];
              break;
            case "value":
              value = (_c = coolchipData == null ? void 0 : coolchipData.values) == null ? void 0 : _c[luxId];
              break;
            case "additional":
              value = (_d = coolchipData == null ? void 0 : coolchipData.additional) == null ? void 0 : _d[luxId];
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
            value = (_i = (_g = (_e = coolchipData == null ? void 0 : coolchipData.values) == null ? void 0 : _e[luxId]) != null ? _g : (_f = coolchipData == null ? void 0 : coolchipData.parameters) == null ? void 0 : _f[luxId]) != null ? _i : (_h = coolchipData == null ? void 0 : coolchipData.additional) == null ? void 0 : _h[luxId];
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
              this.subscribeStates(stateId);
            }
            this.createdStates.add(stateId);
          }
          await this.setStateChangedAsync(stateId, { val: value, ack: true });
        }
      }
      await (0, import_virtualStates.calculateTotalThermalEnergy)(this);
      await (0, import_virtualStates.calculateTotalEnergy)(this);
      await (0, import_virtualStates.updateErrorHistory)(this, rawValues);
      await (0, import_virtualStates.updateOutageHistory)(this, rawValues);
      await (0, import_virtualStates.calculateTemperatureSpread)(this);
      await this.runOptimizationSchedule();
    } catch (catchErr) {
      this.log.error(`Fehler im updateData-Ablauf: ${catchErr.message}`);
    } finally {
      this.updateRunning = false;
    }
  }
  onUnload(callback) {
    try {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = void 0;
        if (this.isDebugLogActive) {
          this.log.info("Polling-Intervall erfolgreich gestoppt.");
        }
      }
      if (this.pump && typeof this.pump.disconnect === "function") {
        this.pump.disconnect();
      }
      if (this.zipTimer) {
        clearTimeout(this.zipTimer);
        this.zipTimer = void 0;
      }
      if (this.isDebugLogActive) {
        this.log.info("Adapter wurde sauber beendet.");
      }
      callback();
    } catch (err) {
      this.log.error(`Fehler beim Beenden des Adapters: ${err.message}`);
      callback();
    }
  }
  async onStateChange(id, state) {
    if (!state || state.ack) {
      if (!state) {
        if (this.isDebugLogActive) {
          this.log.info(`State ${id} wurde gel\xF6scht.`);
        }
      }
      return;
    }
    if (this.isDebugLogActive) {
      this.log.info(`Nutzerbefehl empfangen f\xFCr ${id}: ${state.val}`);
    }
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
      if (mappingKey === "Schreibe_Debug_Log") {
        this.isDebugLogActive = state.val === true;
        if (this.isDebugLogActive) {
          this.log.info(`Erweitertes Logging ist nun ${this.isDebugLogActive ? "AKTIV" : "DEAKTIVIERT"}`);
        }
        await this.setStateAsync(id, { val: state.val, ack: true });
        return;
      }
      if (mappingKey === "Regelung_Aktiv") {
        if (this.isDebugLogActive) {
          this.log.info(`Interner Schalter bet\xE4tigt: Regelung ist nun ${state.val ? "AKTIV" : "PAUSIERT"}`);
        }
        await this.setStateAsync(id, { val: state.val, ack: true });
        return;
      }
      if (mappingKey === "Setze_Vorgabewerte") {
        if (state.val === true) {
          this.log.info("Manueller Trigger: Setze alle Vorgabewerte auf Leerlauf-Standard zur\xFCck...");
          await this.setIdleDefaults();
          await this.setStateAsync(id, { val: false, ack: true });
          this.log.info("Vorgabewerte erfolgreich gesetzt.");
        }
        return;
      }
      if (mappingKey === "zip_aktiv") {
        if (this.isDebugLogActive) {
          this.log.info(`Zip Dauer auf ${state.val} ge\xE4ndert`);
        }
        await this.setStateAsync(id, { val: state.val, ack: true });
        return;
      }
      if (mappingKey === "Dump_Raw_To_Log") {
        if (state.val === true) {
          if (this.isDebugLogActive) {
            this.log.info("Manueller Raw-Dump \xFCber Datenpunkt getriggert...");
          }
          await (0, import_rawFunctions.dumpAllRawToLog)(this);
          await this.setStateAsync(id, { val: false, ack: true });
        }
        return;
      }
      if (mappingKey === "Activate_Zip") {
        if (state.val === true) {
          const durationState = await this.getStateAsync((0, import_stateMapping.getDpPath)("zip_aktiv"));
          const durationSeconds = durationState && typeof durationState.val === "number" ? durationState.val : 120;
          if (durationSeconds <= 0) {
            this.log.warn("ZIP Makro abgebrochen: Die eingestellte Dauer ist 0 oder ung\xFCltig.");
            await this.setStateAsync(id, { val: false, ack: true });
            return;
          }
          const zipOutState = await this.getStateAsync((0, import_stateMapping.getDpPath)("ZIPout"));
          const isAlreadyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;
          if (isAlreadyRunning || this.zipTimer) {
            if (this.isDebugLogActive) {
              this.log.info(
                `ZIP ist bereits aktiv (ZIPout). Setze den Abschalt-Timer neu auf ${durationSeconds} Sekunden.`
              );
            }
            if (this.zipTimer) {
              clearTimeout(this.zipTimer);
              this.zipTimer = void 0;
            }
          } else {
            if (this.isDebugLogActive) {
              this.log.info(
                `Makro gestartet: ZIP Entl\xFCftung wird f\xFCr ${durationSeconds} Sekunden aktiviert...`
              );
            }
            await this.writePumpAsync("runDeaerate", 1);
            await new Promise((resolve) => setTimeout(resolve, 1e3));
            await this.writePumpAsync("hotWaterCircPumpDeaerate", 1);
          }
          await this.setStateAsync(id, { val: true, ack: true });
          await this.updateData();
          this.zipTimer = setTimeout(async () => {
            if (this.isDebugLogActive) {
              this.log.info("ZIP Entl\xFCftung: Zeit abgelaufen. Deaktiviere Pumpe...");
            }
            try {
              await this.writePumpAsync("runDeaerate", 0);
              await new Promise((resolve) => setTimeout(resolve, 1e3));
              await this.writePumpAsync("hotWaterCircPumpDeaerate", 0);
              await this.setStateAsync(id, { val: false, ack: true });
              await this.updateData();
            } catch (err) {
              this.log.error(`Fehler beim automatischen Deaktivieren der ZIP: ${err.message}`);
            }
            this.zipTimer = void 0;
          }, durationSeconds * 1e3);
        } else {
          if (this.isDebugLogActive) {
            this.log.info("Makro manuell abgebrochen: Deaktiviere ZIP Entl\xFCftung sofort...");
          }
          if (this.zipTimer) {
            clearTimeout(this.zipTimer);
            this.zipTimer = void 0;
          }
          await this.writePumpAsync("runDeaerate", 0);
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          await this.writePumpAsync("hotWaterCircPumpDeaerate", 0);
          await this.setStateAsync(id, { val: false, ack: true });
          await this.updateData();
        }
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
        if (this.isDebugLogActive) {
          this.log.info(`Sende RAW-NUMBER an Luxtronik: ID ${paramId} = ${valueToWrite}`);
        }
        await this.writePumpAsync(paramId, valueToWrite, true);
      } else {
        if (this.isDebugLogActive) {
          this.log.info(`Sende STANDARD-STRING an Luxtronik: Name "${luxWriteId}" = ${valueToWrite}`);
        }
        await this.writePumpAsync(luxWriteId, valueToWrite, false);
      }
      if (this.isDebugLogActive) {
        this.log.info(`Wert ${state.val} erfolgreich via [${luxWriteId}] an W\xE4rmepumpe \xFCbertragen.`);
      }
      await this.setStateAsync(id, { val: state.val, ack: true });
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

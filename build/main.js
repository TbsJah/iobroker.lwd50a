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
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    const ip = this.config.host;
    const port = this.config.port || 8889;
    this.log.info(`Verbinde mit W\xE4rmepumpe auf ${ip}:${port}...`);
    this.pump = new luxtronik.createConnection(ip, port);
    this.updateData();
    const zipDef = import_stateMapping.STATE_MAPPING.Activate_Zip;
    if (zipDef) {
      await this.setObjectNotExistsAsync(`${zipDef.folder}.Activate_Zip`, {
        type: "state",
        common: {
          name: zipDef.name,
          type: zipDef.type,
          role: zipDef.role,
          read: true,
          write: true,
          def: 0,
          // Standardwert auf AUS
          states: zipDef.states
        },
        native: {}
      });
      await this.setState(`${zipDef.folder}.Activate_Zip`, { val: 0, ack: true });
      await this.subscribeStatesAsync(`${zipDef.folder}.Activate_Zip`);
    }
    const paramId = 700;
    this.log.info(`Sende RAW an Luxtronik via Bibliothek: ID ${paramId} = ${15}`);
    this.pump.writeRaw(paramId, 15, (err, data) => {
      if (err) {
        this.log.error(`Raw-Write fehlgeschlagen f\xFCr ID ${paramId}: ${err.message}`);
        return;
      }
      this.log.info(`Raw-Write erfolgreich auf ${15} gesetzt! Pumpe antwortet: ${JSON.stringify(data)}`);
      try {
        this.updateData();
      } catch (setStateErr) {
        this.log.error(`Fehler beim Best\xE4tigen des Status im ioBroker: ${setStateErr.message}`);
      }
    });
    let intervalSeconds = this.config.interval || 30;
    if (intervalSeconds < 10) {
      intervalSeconds = 10;
      this.log.warn("Eingestelltes Intervall war zu kurz. Wurde zum Schutz auf 10 Sekunden korrigiert.");
    }
    this.log.info(`Starte Polling-Intervall. Lese Daten alle ${intervalSeconds} Sekunden aus.`);
    this.pollingInterval = setInterval(() => {
      this.log.debug("Polling ausgel\xF6st: Hole frische Daten von der W\xE4rmepumpe...");
      this.updateData();
    }, intervalSeconds * 1e3);
  }
  /**
   * Liest die komplette Liste (alle Parameter oder alle Messwerte) per TCP aus.
   *
   * @param command 3003 (Parameter) oder 3004 (Messwerte)
   * @returns Ein Promise, das ein Array mit allen Werten zurückgibt
   */
  readAllRaw(command) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const host = this.config.host;
      const port = this.config.port || 8888;
      let responseData = Buffer.alloc(0);
      client.connect(port, host, () => {
        this.log.info(`[RAW READ ALL] Fordere komplette Liste ${command} an...`);
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
   * Holt die Daten von der Wärmepumpe und schreibt sie in ioBroker
   */
  updateData() {
    if (!this.pump) {
      this.log.error("Abfrage abgebrochen: Keine aktive Verbindung zur W\xE4rmepumpe vorhanden.");
      return;
    }
    this.pump.read(async (err, data) => {
      if (err) {
        if (err.message && err.message.toLowerCase().includes("busy")) {
          this.log.warn("W\xE4rmepumpe ist ausgelastet (busy). \xDCberspringe diesen Abfrage-Zyklus.");
          return;
        }
        this.log.error(`Verbindungsfehler beim Einlesen der Daten: ${err.message}`);
        return;
      }
      try {
        const allIncomingData = {
          ...data.values,
          ...data.parameters
        };
        for (const [key, value] of Object.entries(allIncomingData)) {
          const definition = import_stateMapping.STATE_MAPPING[key];
          if (definition) {
            const configWithDynamicKeys = this.config;
            const configKey = `sync_${key}`;
            if (configWithDynamicKeys[configKey] === false) {
              this.log.debug(`Datenpunkt ${key} \xFCbersprungen, da in der Konfiguration deaktiviert.`);
              continue;
            }
            const folderId = definition.folder;
            const stateId = `${folderId}.${key}`;
            let finalValue = value;
            if (definition.type === "number") {
              if (typeof value === "string") {
                const textValue = value.toLowerCase();
                if (textValue === "ein") {
                  finalValue = 1;
                } else if (textValue === "aus") {
                  finalValue = 0;
                } else {
                  finalValue = parseFloat(value);
                }
              } else {
                finalValue = value;
              }
            } else if (definition.type === "boolean") {
              if (typeof value === "string") {
                const textValue = value.toLowerCase();
                if (textValue === "ein" || textValue === "true" || textValue === "1") {
                  finalValue = true;
                } else if (textValue === "aus" || textValue === "false" || textValue === "0") {
                  finalValue = false;
                } else {
                  finalValue = false;
                }
              } else {
                finalValue = value === true || value === 1;
              }
            }
            if (typeof finalValue === "number" && !isNaN(finalValue) && definition.factor) {
              finalValue = finalValue / definition.factor;
            }
            if (!this.createdStates.has(stateId)) {
              await this.setObjectNotExists(folderId, {
                type: "channel",
                common: {
                  name: folderId.charAt(0).toUpperCase() + folderId.slice(1)
                },
                native: {}
              });
              await this.setObjectNotExists(stateId, {
                type: "state",
                common: {
                  name: definition.name,
                  type: definition.type,
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
                await this.subscribeStatesAsync(stateId);
              }
              this.createdStates.add(stateId);
            }
            await this.setState(stateId, finalValue, true);
          }
        }
      } catch (catchErr) {
        this.log.error(
          `Fehler beim Schreiben der Objekte in die ioBroker-Datenbank: ${catchErr.message}`
        );
      }
    });
  }
  /**
   * Wird aufgerufen, wenn der Adapter beendet wird (z.B. Neustart oder Update)
   *
   * @param callback - Callback-Funktion, die aufgerufen wird, wenn das Beenden abgeschlossen ist
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
  // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
  // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
  // /**
  //  * Is called if a subscribed object changes
  //  */
  // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
  // 	if (obj) {
  // 		// The object was changed
  // 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
  // 	} else {
  // 		// The object was deleted
  // 		this.log.info(`object ${id} deleted`);
  // 	}
  // }
  /**
   * Is called if a subscribed state changes
   *
   * @param id - State ID
   * @param state - State object
   */
  async onStateChange(id, state) {
    if (!state) {
      this.log.info(`State ${id} wurde gel\xF6scht.`);
      return;
    }
    if (state.ack) {
      return;
    }
    this.log.info(`Nutzerbefehl empfangen f\xFCr ${id}: ${state.val}`);
    const mappingKey = id.split(".").pop();
    if (!mappingKey) {
      this.log.warn(`Konnte keinen g\xFCltigen State-Schl\xFCssel aus der ID extrahieren: ${id}`);
      return;
    }
    this.log.info(mappingKey);
    const definition = import_stateMapping.STATE_MAPPING[mappingKey];
    this.log.info(`Wert ge\xE4ndert f\xFCr ${mappingKey}: ${JSON.stringify(definition)}`);
    if (!definition) {
      this.log.warn(`Kein Mapping f\xFCr ${mappingKey} gefunden.`);
      return;
    }
    if (mappingKey === "Activate_Zip") {
      const zipOutState = await this.getStateAsync("Informationen.Ausgaenge.ZIPout");
      const isCurrentlyRunning = zipOutState ? zipOutState.val === 1 || zipOutState.val === true : false;
      const targetVal = isCurrentlyRunning ? 0 : 1;
      const actionText = targetVal === 1 ? "Aktiviere" : "Deaktiviere";
      this.log.info(
        `Makro gestartet: ${actionText} ZIP Entl\xFCftung basierend auf ZIPout (Ziel-Status: ${targetVal})...`
      );
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
          this.updateData();
        });
      });
      return;
    }
    if (!definition.luxWriteId || definition.write !== true) {
      this.log.warn(`Kein Schreib-Mapping f\xFCr ${mappingKey} gefunden.`);
      return;
    }
    if (typeof state.val === "number") {
      if (definition.min !== void 0 && state.val < definition.min) {
        this.log.warn(
          `Eingabewert ${state.val} unterschreitet Minimum von ${definition.min} f\xFCr ${mappingKey}. Abgebrochen.`
        );
        return;
      }
      if (definition.max !== void 0 && state.val > definition.max) {
        this.log.warn(
          `Eingabewert ${state.val} \xFCberschreitet Maximum von ${definition.max} f\xFCr ${mappingKey}. Abgebrochen.`
        );
        return;
      }
    }
    if (!this.pump) {
      this.log.error("Schreiben abgebrochen: Keine aktive Verbindung zur W\xE4rmepumpe vorhanden.");
      return;
    }
    let valueToWrite = state.val;
    if (definition.factor && typeof state.val === "number") {
      valueToWrite = state.val * definition.factor;
    }
    this.log.info(`Sende an Luxtronik: ${definition.luxWriteId} = ${valueToWrite}`);
    this.pump.write(definition.luxWriteId, valueToWrite, async (err, _result) => {
      if (err) {
        this.log.error(`Fehler beim Schreiben an Luxtronik (${definition.luxWriteId}): ${err.message}`);
        return;
      }
      this.log.info(`Wert ${state.val} erfolgreich an W\xE4rmepumpe \xFCbertragen.`);
      try {
        await this.setState(id, state.val, true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.updateData();
      } catch (setStateErr) {
        this.log.error(`Fehler beim Best\xE4tigen des Status im ioBroker: ${setStateErr.message}`);
      }
    });
  }
  // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
  // /**
  //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
  //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
  //  */
  //
  // private onMessage(obj: ioBroker.Message): void {
  // 	if (typeof obj === "object" && obj.message) {
  // 		if (obj.command === "send") {
  // 			// e.g. send email or pushover or whatever
  // 			this.log.info("send command");
  // 			// Send response in callback if required
  // 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
  // 		}
  // 	}
  // }
}
if (require.main !== module) {
  module.exports = (options) => new Lwd50a(options);
} else {
  (() => new Lwd50a())();
}
//# sourceMappingURL=main.js.map

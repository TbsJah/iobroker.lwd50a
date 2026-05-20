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
var import_stateMapping = require("./stateMapping");
class Lwd50a extends utils.Adapter {
  pollingInterval;
  pump;
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
  onReady() {
    const ip = "192.168.178.81";
    const port = 8889;
    this.log.info(`Verbinde mit W\xE4rmepumpe auf ${ip}:${port}...`);
    this.pump = new luxtronik.createConnection(ip, port);
    this.updateData();
    this.pollingInterval = setInterval(() => {
      this.updateData();
    }, 3e4);
  }
  /**
   * Holt die Daten von der Wärmepumpe und schreibt sie in ioBroker
   */
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
          this.log.warn("W\xE4rmepumpe ist ausgelastet (busy). Erneuter Versuch in 15 Sekunden...");
          setTimeout(() => {
            this.updateData();
          }, 15e3);
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
            const folderId = definition.folder;
            const stateId = `${folderId}.${key}`;
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
            await this.setState(stateId, value, true);
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
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback - Callback function
   */
  onUnload(callback) {
    try {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
      callback();
    } catch (error) {
      this.log.error(`Error during unloading: ${error.message}`);
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
  onStateChange(id, state) {
    if (!state) {
      this.log.info(`State ${id} wurde gel\xF6scht.`);
      return;
    }
    if (state.ack) {
      return;
    }
    this.log.info(`Nutzerbefehl empfangen f\xFCr ${id}: ${state.val}`);
    const idParts = id.split(".");
    idParts.shift();
    idParts.shift();
    idParts.shift();
    this.log.info(idParts[0]);
    const mappingKey = idParts[0];
    const definition = import_stateMapping.STATE_MAPPING[mappingKey];
    if (!definition || !definition.LuxID) {
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
    this.log.info(`Sende an Luxtronik: ${definition.LuxID} = ${state.val}`);
    this.pump.write(definition.LuxID, state.val, (err, _result) => {
      if (err) {
        this.log.error(`Fehler beim Schreiben an Luxtronik (${definition.LuxID}): ${err.message}`);
        return;
      }
      this.log.info(`Wert ${state.val} erfolgreich an W\xE4rmepumpe \xFCbertragen.`);
      this.setState(id, state.val, true, (setStateErr) => {
        if (setStateErr) {
          this.log.error(`Fehler beim Best\xE4tigen des Status im ioBroker: ${setStateErr.message}`);
        }
        this.updateData();
      }).catch((err2) => {
        this.log.error(`Fehler beim Schreiben des Status: ${err2}`);
      });
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

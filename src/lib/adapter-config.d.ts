// This file extends the AdapterConfig type from "@iobroker/types"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			host: string;
			port: number;
			interval: number;
			fusspunkt?: number;
			endpunkt?: number;
			zip_aktiv?: number;
			zip_aktiv_ww?: number;
			sync_warmwater_target_temperature?: number;
			sync_hotwater_temperature_hysteresis?: number;
			sync_heating_system_circ_pump_voltage_minimal?: number;
			sync_heating_system_circ_pump_voltage_nominal?: number;
			sync_return_temperature_hysteresis?: number;
			regelung_aktiv?: boolean;
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};

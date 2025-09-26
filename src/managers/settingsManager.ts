import type { StorageManager } from "./storageManager";

export interface Settings {
	search: {
		enableDryBuy: boolean;
		randomMinBid: {
			enabled: boolean;
			amount: number;
		};
		randomMinBuy: {
			enabled: boolean;
			amount: number;
		};
		enableWinSound: boolean;
		enableFailSound: boolean;
		enableErrorSound: boolean;
		soundsVolume: number;
	};
	safety: {
		delayBetweenSearches: {
			min: number;
			max: number;
		};
		enabledCycles: boolean;
		cyclesCount: {
			min: number;
			max: number;
		};
		delayBetweenCycles: {
			min: number;
			max: number;
		};
	};
}

export class SettingsManager {
	settings: Settings;

	private get defaultSettings(): Settings {
		return {
			search: {
				enableDryBuy: false,
				randomMinBid: {
					enabled: false,
					amount: 300,
				},
				randomMinBuy: {
					enabled: false,
					amount: 300,
				},
				enableWinSound: true,
				enableFailSound: false,
				enableErrorSound: true,
				soundsVolume: 0.5,
			},
			safety: {
				delayBetweenSearches: {
					min: 2,
					max: 6,
				},
				enabledCycles: true,
				cyclesCount: {
					min: 10,
					max: 15,
				},
				delayBetweenCycles: {
					min: 10,
					max: 15,
				},
			},
		};
	}

	private loadSettings() {
		this.settings = this.storageManager.loadSettings(this.defaultSettings);
	}

	constructor(
		private storageManager: StorageManager,
	) {
		this.loadSettings();
	}

	save() {
		this.storageManager.saveSettings(this.settings);
	}

	reset() {
		this.settings = this.storageManager.loadSettings(this.defaultSettings);
		this.save();
	}
}

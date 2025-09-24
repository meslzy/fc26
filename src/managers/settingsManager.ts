import type { StorageManager } from "./storageManager";

export interface Settings {
	search: {
		enableDryBuy: boolean;
		enableSound: boolean;
		randomMinBid: {
			enabled: boolean;
			amount: number;
		};
		randomMinBuy: {
			enabled: boolean;
			amount: number;
		};
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
				enableSound: true,
				randomMinBid: {
					enabled: false,
					amount: 150,
				},
				randomMinBuy: {
					enabled: false,
					amount: 150,
				},
			},
			safety: {
				delayBetweenSearches: {
					min: 4,
					max: 7,
				},
				enabledCycles: true,
				cyclesCount: {
					min: 5,
					max: 10,
				},
				delayBetweenCycles: {
					min: 60,
					max: 120,
				},
			},
		};
	}

	private loadSettings() {
		this.settings = this.storageManager.loadSettings(this.defaultSettings);
	}

	private saveSettings() {
		this.storageManager.saveSettings(this.settings);
	}

	constructor(
		private storageManager: StorageManager,
	) {
		this.loadSettings();
	}

	enableDryBuy(enabled: boolean) {
		this.settings.search.enableDryBuy = enabled;
		this.saveSettings();
	}

	enableSound(enabled: boolean) {
		this.settings.search.enableSound = enabled;
		this.saveSettings();
	}

	updateRandomMinBid(enabled: boolean, amount?: number) {
		this.settings.search.randomMinBid.enabled = enabled;
		if (amount !== undefined) {
			this.settings.search.randomMinBid.amount = amount;
		}
		this.saveSettings();
	}

	updateRandomMinBuy(enabled: boolean, amount?: number) {
		this.settings.search.randomMinBuy.enabled = enabled;
		if (amount !== undefined) {
			this.settings.search.randomMinBuy.amount = amount;
		}
		this.saveSettings();
	}

	updateDelayBetweenSearches(min: number, max: number) {
		this.settings.safety.delayBetweenSearches.min = min;
		this.settings.safety.delayBetweenSearches.max = max;
		this.saveSettings();
	}

	enableCycles(enabled: boolean) {
		this.settings.safety.enabledCycles = enabled;
		this.saveSettings();
	}

	updateCyclesCount(min: number, max: number) {
		this.settings.safety.cyclesCount.min = min;
		this.settings.safety.cyclesCount.max = max;
		this.saveSettings();
	}

	updateDelayBetweenCycles(min: number, max: number) {
		this.settings.safety.delayBetweenCycles.min = min;
		this.settings.safety.delayBetweenCycles.max = max;
		this.saveSettings();
	}

	getRandomMinBid(): { enabled: boolean; amount: number } {
		return this.settings.search.randomMinBid;
	}

	getRandomMinBuy(): { enabled: boolean; amount: number } {
		return this.settings.search.randomMinBuy;
	}

	getDelayBetweenSearches(): { min: number; max: number } {
		return this.settings.safety.delayBetweenSearches;
	}

	getCyclesEnabled(): boolean {
		return this.settings.safety.enabledCycles;
	}

	getCyclesCount(): { min: number; max: number } {
		return this.settings.safety.cyclesCount;
	}

	getDelayBetweenCycles(): { min: number; max: number } {
		return this.settings.safety.delayBetweenCycles;
	}

	reset() {
		this.settings = this.storageManager.loadSettings(this.defaultSettings);
		this.saveSettings();
	}
}

import type { StorageManager } from "./storageManager";

export interface Settings {
	search: {
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
	};
}

export class SettingsManager {
	settings: Settings;

	constructor(
		private storageManager: StorageManager,
	) {
		this.loadSettings();
	}

	private get defaultSettings(): Settings {
		return {
			search: {
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
			},
		};
	}

	private loadSettings() {
		this.settings = this.storageManager.loadSettings(this.defaultSettings);
	}

	private saveSettings() {
		this.storageManager.saveSettings(this.settings);
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

	getRandomMinBid(): { enabled: boolean; amount: number } {
		return this.settings.search.randomMinBid;
	}

	getRandomMinBuy(): { enabled: boolean; amount: number } {
		return this.settings.search.randomMinBuy;
	}

	getDelayBetweenSearches(): { min: number; max: number } {
		return this.settings.safety.delayBetweenSearches;
	}

	reset() {
		this.settings = this.storageManager.loadSettings(this.defaultSettings);
		this.saveSettings();
	}
}

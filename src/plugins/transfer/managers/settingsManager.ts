export interface Settings {
	search: {
		enableDryBuy: boolean;
		filterRotation: "sequential" | "per-cycle" | "random";
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
	private readonly KEY = "fc26_settings";

	settings: Settings;

	defaultSettings: Settings = {
		search: {
			enableDryBuy: false,
			filterRotation: "sequential",
			randomMinBid: {
				enabled: false,
				amount: 300,
			},
			randomMinBuy: {
				enabled: false,
				amount: 300,
			},
			enableWinSound: true,
			enableFailSound: true,
			enableErrorSound: true,
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

	private deepMerge(target: any, source: any): any {
		const result = { ...target };
		for (const key in source) {
			if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
				result[key] = this.deepMerge(target[key] || {}, source[key]);
			} else if (source[key] !== undefined) {
				result[key] = source[key];
			}
		}
		return result;
	}

	private load() {
		const savedSettings = localStorage.getItem(this.KEY);
		if (savedSettings) {
			const parsed = JSON.parse(savedSettings);
			this.settings = this.deepMerge(this.defaultSettings, parsed);
		} else {
			this.settings = this.defaultSettings;
		}
	}

	constructor() {
		this.load();
	}

	save() {
		localStorage.setItem(this.KEY, JSON.stringify(this.settings));
	}

	reset() {
		this.settings = this.defaultSettings;
		this.save();
	}
}

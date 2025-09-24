import type { Filter } from "./filterManager";
import type { Settings } from "./settingsManager";

export class StorageManager {
	private readonly FILTERS_KEY = "fc26_saved_filters";
	private readonly SETTINGS_KEY = "fc26_settings";

	saveFilters(filters: Filter[]): void {
		localStorage.setItem(this.FILTERS_KEY, JSON.stringify(filters));
	}

	loadFilters(): Filter[] {
		const saved = localStorage.getItem(this.FILTERS_KEY);

		if (saved) {
			const loadedFilters = JSON.parse(saved);
			return loadedFilters.map((filter: any) => ({
				...filter,
				id: filter.id || Date.now().toString(),
			}));
		}

		return [];
	}

	saveSettings(settings: Settings): void {
		localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
	}

	loadSettings(defaultSettings: Settings): Settings {
		const saved = localStorage.getItem(this.SETTINGS_KEY);

		if (saved) {
			try {
				return JSON.parse(saved);
			} catch {
				return defaultSettings;
			}
		}

		return defaultSettings;
	}
}

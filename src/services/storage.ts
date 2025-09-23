import type { FilterData, SniperSettings } from "~/types";

export class StorageService {
	private static readonly SETTINGS_KEY = "fc26_sniper_settings";
	private static readonly FILTERS_KEY = "fc26_saved_filters";

	static saveSettings(settings: SniperSettings): void {
		try {
			localStorage.setItem(
				StorageService.SETTINGS_KEY,
				JSON.stringify(settings),
			);
		} catch (e) {
			console.log("Failed to save settings:", e);
		}
	}

	static loadSettings(defaults: SniperSettings): SniperSettings {
		try {
			const saved = localStorage.getItem(StorageService.SETTINGS_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				return { ...defaults, ...parsed };
			}
		} catch (e) {
			console.log("Failed to load settings:", e);
		}
		return defaults;
	}

	static saveFilters(filters: FilterData[]): void {
		try {
			localStorage.setItem(StorageService.FILTERS_KEY, JSON.stringify(filters));
		} catch (e) {
			console.log("Failed to save filters:", e);
		}
	}

	static loadFilters(): FilterData[] {
		try {
			const saved = localStorage.getItem(StorageService.FILTERS_KEY);
			if (saved) {
				const loadedFilters = JSON.parse(saved);
				loadedFilters.forEach((filter: FilterData) => {
					filter.id ??= `filter_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
				});
				return loadedFilters;
			}
		} catch (e) {
			console.log("Failed to load saved filters:", e);
		}
		return [];
	}
}

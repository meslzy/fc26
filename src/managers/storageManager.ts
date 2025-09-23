import type { FilterItem } from "./filterManager";

export class StorageManager {
	private static readonly FILTERS_KEY = "fc26_saved_filters";

	static saveFilters(filters: FilterItem[]): void {
		try {
			localStorage.setItem(
				StorageManager.FILTERS_KEY,
				JSON.stringify(filters),
			);
		} catch (e) {
			console.log("Failed to save filters:", e);
		}
	}

	static loadFilters(): FilterItem[] {
		try {
			const saved = localStorage.getItem(StorageManager.FILTERS_KEY);
			if (saved) {
				const loadedFilters = JSON.parse(saved);
				return loadedFilters.map((filter: any) => ({
					...filter,
					id: filter.id || Date.now().toString(),
				}));
			}
		} catch (e) {
			console.log("Failed to load saved filters:", e);
		}
		return [];
	}
}
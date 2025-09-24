import type { FilterItem } from "./filterManager";

export class StorageManager {
	private static readonly FILTERS_KEY = "fc26_saved_filters";

	static saveFilters(filters: FilterItem[]): void {
		localStorage.setItem(
			StorageManager.FILTERS_KEY,
			JSON.stringify(filters),
		);
	}

	static loadFilters(): FilterItem[] {
		const saved = localStorage.getItem(StorageManager.FILTERS_KEY);

		if (saved) {
			const loadedFilters = JSON.parse(saved);
			return loadedFilters.map((filter: any) => ({
				...filter,
				id: filter.id || Date.now().toString(),
			}));
		}

		return [];
	}
}

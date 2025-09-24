import type { SearchBucket } from "~/core/bucket";
import type {
	PlayerData,
	SearchCriteria,
	SearchManager,
} from "./searchManager";
import type { StorageManager } from "./storageManager";

export interface Filter {
	id: string;
	name: string;
	searchBucket: SearchBucket;
	playerData: PlayerData | null;
	searchCriteria: SearchCriteria;
	timestamp: number;
}

export class FilterManager {
	private selectedFilters: Map<SearchBucket, Set<string>> = new Map();

	filters: Filter[] = [];

	constructor(
		private storageManager: StorageManager,
		private searchManager: SearchManager,
	) {
		this.loadFilters();
	}

	private loadFilters() {
		this.filters = this.storageManager.loadFilters();
	}

	private saveFilters() {
		this.storageManager.saveFilters(this.filters);
	}

	private getName(
		searchCriteria: SearchCriteria,
		playerData: PlayerData | null,
	): string {
		let baseName = "";

		if (playerData?.firstName) {
			baseName = `${playerData.firstName} ${playerData.lastName || ""} (${playerData.rating || "?"})`;
		}

		const defaultCriteria = this.searchManager.getDefaultSearchCriteria();

		const changes: string[] = [];

		for (const [key, value] of Object.entries(searchCriteria)) {
			const defaultValue = defaultCriteria[key as keyof SearchCriteria];

			if (this.hasSignificantChange(key, value, defaultValue)) {
				const displayName = this.formatFieldChange(key, value);
				if (displayName) {
					changes.push(displayName);
				}
			}
		}

		if (baseName) {
			const priceChanges = changes.filter(
				(c) => c.includes("Min:") || c.includes("Max:"),
			);
			if (priceChanges.length > 0) {
				return `${baseName} | ${priceChanges.join(", ")}`;
			}
			return baseName;
		}

		if (changes.length === 0) {
			return "Default Filter";
		}

		return changes.slice(0, 4).join(", ");
	}

	private hasSignificantChange(
		key: string,
		value: any,
		defaultValue: any,
	): boolean {
		const skipFields = [
			"count",
			"offset",
			"_sort",
			"blockingRequests",
			"requests",
		];
		if (skipFields.includes(key)) return false;

		if (Array.isArray(value) && Array.isArray(defaultValue)) {
			return (
				value.length !== defaultValue.length ||
				!value.every((v, i) => v === defaultValue[i])
			);
		}

		if (typeof value === "number" && typeof defaultValue === "number") {
			if (key.includes("Buy") || key.includes("Bid")) {
				return value > 0;
			}
			return value !== defaultValue;
		}

		return value !== defaultValue;
	}

	private formatFieldChange(key: string, value: any): string | null {
		if (key === "minBuy" && value > 0) return `Min: ${value.toLocaleString()}`;
		if (key === "maxBuy" && value > 0) return `Max: ${value.toLocaleString()}`;

		if (key === "nation" && value > -1) return `Nation: ${value}`;
		if (key === "league" && value > -1) return `League: ${value}`;
		if (key === "club" && value > -1) return `Club: ${value}`;
		if (key === "level" && value !== "any") return `Level: ${value}`;
		if (key === "playStyle" && value > -1) return `PlayStyle: ${value}`;

		if (key === "_position" && value !== "any") return `Pos: ${value}`;
		if (key === "ovrMin" && value > 45) return `OVR: ${value}+`;
		if (key === "ovrMax" && value < 99) return `OVR: -${value}`;
		if (key === "_authenticity" && value !== "any") return `Auth: ${value}`;

		if (key === "rarities" && Array.isArray(value) && value.length > 0) {
			return `Rarities: ${value.length}`;
		}

		return null;
	}

	save(searchBucket: SearchBucket) {
		const searchCriteria = this.searchManager.getSearchCriteria();
		const playerData = this.searchManager.getSearchPlayerData();

		const id = Date.now().toString();

		const data: Filter = {
			id,
			name: this.getName(searchCriteria, playerData),
			searchBucket,
			playerData,
			searchCriteria,
			timestamp: Date.now(),
		};

		this.filters.push(data);
		this.saveFilters();
	}

	remove(id: string) {
		this.filters = this.filters.filter((filter) => filter.id !== id);
		this.saveFilters();
	}

	select(id: string) {
		const filter = this.filters.find((f) => f.id === id);

		this.searchManager.setSearch(
			filter ? filter.searchCriteria : {},
			filter ? filter.playerData : null,
		);
	}

	update(id: string, searchBucket: SearchBucket) {
		const filterIndex = this.filters.findIndex((f) => f.id === id);
		if (filterIndex === -1) return;

		const searchCriteria = this.searchManager.getSearchCriteria();
		const playerData = this.searchManager.getSearchPlayerData();

		this.filters[filterIndex] = {
			...this.filters[filterIndex],
			name: this.getName(searchCriteria, playerData),
			searchBucket,
			playerData,
			searchCriteria,
			timestamp: Date.now(),
		};

		this.saveFilters();
	}

	clearAll(searchBucket: SearchBucket) {
		this.filters = this.filters.filter(
			(filter) => filter.searchBucket !== searchBucket,
		);
		this.saveFilters();
		this.selectedFilters.delete(searchBucket);
	}

	toggleSelection(filterId: string, searchBucket: SearchBucket) {
		if (!this.selectedFilters.has(searchBucket)) {
			this.selectedFilters.set(searchBucket, new Set());
		}

		const bucketSelections = this.selectedFilters.get(searchBucket)!;

		if (bucketSelections.has(filterId)) {
			bucketSelections.delete(filterId);
		} else {
			bucketSelections.add(filterId);
		}
	}

	selectAll(searchBucket: SearchBucket) {
		const bucketFilters = this.filters.filter(
			(f) => f.searchBucket === searchBucket,
		);
		const filterIds = new Set(bucketFilters.map((f) => f.id));
		this.selectedFilters.set(searchBucket, filterIds);
	}

	deselectAll(searchBucket: SearchBucket) {
		this.selectedFilters.set(searchBucket, new Set());
	}

	isSelected(filterId: string, searchBucket: SearchBucket): boolean {
		return this.selectedFilters.get(searchBucket)?.has(filterId) || false;
	}

	getSelectedCount(searchBucket: SearchBucket): number {
		return this.selectedFilters.get(searchBucket)?.size || 0;
	}

	getTotalCount(searchBucket: SearchBucket): number {
		return this.filters.filter((f) => f.searchBucket === searchBucket).length;
	}

	getSearchCriterias(searchBucket: SearchBucket): SearchCriteria[] {
		const selectedIds = this.selectedFilters.get(searchBucket) || new Set();

		const criteria: SearchCriteria[] = [];

		for (const filter of this.filters) {
			if (selectedIds.has(filter.id)) {
				criteria.push(filter.searchCriteria);
			}
		}

		if (criteria.length === 0) {
			criteria.push(this.searchManager.getSearchCriteria());
		}

		return criteria;
	}
}

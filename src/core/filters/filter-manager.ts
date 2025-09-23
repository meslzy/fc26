import { StorageService } from "~/services/storage";
import type { FilterData } from "~/types";
import type { Logger } from "~/utils/logger";

export class FilterManager {
	private savedFilters: FilterData[] = [];
	private selectedFilterIndices = new Set<number>();
	private editingFilterId: string | null = null;
	private currentFilterIndex = 0;
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
		this.loadSavedFilters();
	}

	private loadSavedFilters() {
		this.savedFilters = StorageService.loadFilters();
	}

	getSelectedFilters(): FilterData[] {
		return Array.from(this.selectedFilterIndices)
			.sort((a, b) => a - b)
			.map((index) => this.savedFilters[index]);
	}

	getCurrentFilter(): FilterData | null {
		const selectedFilters = this.getSelectedFilters();
		if (selectedFilters.length === 0) return null;
		return selectedFilters[this.currentFilterIndex % selectedFilters.length];
	}

	moveToNextFilter() {
		this.currentFilterIndex++;
	}

	resetFilterIndex() {
		this.currentFilterIndex = 0;
	}

	isEditing(): boolean {
		return this.editingFilterId !== null;
	}

	getEditingFilterId(): string | null {
		return this.editingFilterId;
	}

	setEditingFilterId(id: string | null) {
		this.editingFilterId = id;
	}

	cancelEditing() {
		this.editingFilterId = null;
	}

	saveFilter(itemData: any, searchCriteria: any): void {
		const cleanedSearchCriteria = JSON.parse(JSON.stringify(searchCriteria));

		cleanedSearchCriteria.maxBid = 0;
		cleanedSearchCriteria.minBid = 0;

		const filterId =
			this.editingFilterId ||
			`filter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

		const filterData: FilterData = {
			id: filterId,
			playerData: itemData ? JSON.parse(JSON.stringify(itemData)) : null,
			searchCriteria: cleanedSearchCriteria,
			timestamp: Date.now(),
			description: this.createFilterDescription(itemData, searchCriteria),
		};

		if (this.editingFilterId) {
			const existingIndex = this.savedFilters.findIndex(
				(f) => f.id === this.editingFilterId,
			);
			if (existingIndex !== -1) {
				this.savedFilters[existingIndex] = filterData;
				this.logger.addLog(
					`Filter updated: ${filterData.description}`,
					"system",
				);
			}
			this.editingFilterId = null;
		} else {
			this.savedFilters.push(filterData);
			this.logger.addLog(`Filter saved: ${filterData.description}`, "system");
		}

		StorageService.saveFilters(this.savedFilters);
	}

	deleteFilter(index: number): void {
		const filter = this.savedFilters[index];
		if (filter) {
			this.savedFilters.splice(index, 1);
			StorageService.saveFilters(this.savedFilters);
			this.logger.addLog(`Filter deleted: ${filter.description}`, "system");
		}
	}

	clearAllFilters(): void {
		this.savedFilters.length = 0;
		StorageService.saveFilters(this.savedFilters);
		this.logger.addLog("All filters cleared", "system");
	}

	toggleFilterSelection(index: number): void {
		if (this.selectedFilterIndices.has(index)) {
			this.selectedFilterIndices.delete(index);
		} else {
			this.selectedFilterIndices.add(index);
		}
	}

	selectAllFilters(): void {
		this.selectedFilterIndices.clear();
		this.savedFilters.forEach((_, index) => {
			this.selectedFilterIndices.add(index);
		});
	}

	clearSelection(): void {
		this.selectedFilterIndices.clear();
	}

	getFilterCount(): number {
		return this.savedFilters.length;
	}

	getSelectedCount(): number {
		return this.selectedFilterIndices.size;
	}

	getAllFilters(): FilterData[] {
		return this.savedFilters;
	}

	getFilterById(id: string): FilterData | undefined {
		return this.savedFilters.find((f) => f.id === id);
	}

	isFilterSelected(index: number): boolean {
		return this.selectedFilterIndices.has(index);
	}

	loadFilter(filterData: FilterData): boolean {
		try {
			const controller = getAppMain()
				.getRootViewController()
				.getPresentedViewController()
				.getCurrentViewController()
				.getCurrentController();

			if (filterData.playerData) {
				controller.viewmodel.playerData = filterData.playerData;
			}

			Object.assign(
				controller.viewmodel.searchCriteria,
				filterData.searchCriteria,
			);

			controller.viewDidAppear();

			this.logger.addLog(`Filter loaded: ${filterData.description}`, "success");
			return true;
		} catch {
			this.logger.addLog("Failed to load filter", "error");
			return false;
		}
	}

	private createFilterDescription(itemData: any, searchCriteria: any): string {
		let description = "";

		if (itemData?.firstName) {
			description = `${itemData.firstName} ${itemData.lastName || ""} (${itemData.rating || "?"})`;
		} else {
			description = "Any Item";
		}

		const buyRange = `${searchCriteria.minBuy || 0}-${searchCriteria.maxBuy || 0}`;
		return `${description} | Buy: ${buyRange}`;
	}
}

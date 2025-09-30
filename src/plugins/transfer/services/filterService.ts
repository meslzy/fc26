import type { FilterManager } from "../managers/filterManager";

export class FilterService {
	private buttonContainer: HTMLElement;
	private saveFilterButton: HTMLButtonElement;
	private manageFiltersButton: HTMLButtonElement;
	private selectedFiltersButton: HTMLButtonElement;

	private modal: HTMLElement;
	private modalTitle: HTMLHeadingElement;
	private modalContent: HTMLElement;
	private modalCloseButton: HTMLButtonElement;
	private modalClearAllButton: HTMLButtonElement;
	private selectAllButton: HTMLButtonElement;
	private deselectAllButton: HTMLButtonElement;

	private searchBucket: SearchBucket = SearchBucket.PLAYER;
	private editingFilterId: string | null = null;

	private createbuttonContainer() {
		this.buttonContainer = document.createElement("div");
		this.buttonContainer.classList.add("button-container");

		this.manageFiltersButton = createButton({
			text: "Filters",
			size: "mini",
			onclick: () => {
				if (this.editingFilterId) {
					this.exitEditMode();
				} else {
					this.updateModalContent();
					this.updateSelectedCount();
					this.modal.style.display = "flex";
				}
			},
		});

		this.saveFilterButton = createButton({
			text: "Save",
			size: "mini",
			variant: "primary",
			onclick: () => {
				if (this.editingFilterId) {
					this.filterManager.update(this.editingFilterId, this.searchBucket);
					this.exitEditMode();
				} else {
					this.filterManager.save(this.searchBucket);
					this.saveFilterButton.textContent = "Saved!";
					this.updateSelectedCount();
					setTimeout(() => {
						this.saveFilterButton.textContent = "Save";
					}, 1500);
				}
			},
		});

		this.selectedFiltersButton = createButton({
			text: "Selected (0)",
			size: "mini",
			style: {
				flex: "unset",
			},
			onclick: () => {
				this.filterManager.deselectAll(this.searchBucket);
				this.updateModalContent();
				this.updateSelectedCount();
			},
		});

		this.buttonContainer.appendChild(this.manageFiltersButton);
		this.buttonContainer.appendChild(this.saveFilterButton);
		this.buttonContainer.appendChild(this.selectedFiltersButton);
	}

	private createModal() {
		this.modal = document.createElement("div");
		this.modal.classList.add("modal");
		this.modal.style.display = "none";
		this.modal.style.flexDirection = "column";
		this.modal.style.gap = "10px";
		this.modal.style.position = "absolute";
		this.modal.style.padding = "24px";
		this.modal.style.zIndex = "1000";
		this.modal.style.inset = "0";
		this.modal.style.overflow = "hidden";
		this.modal.style.backgroundColor = "rgb(32 31 38 / 95%)";

		this.modalTitle = document.createElement("h2");
		this.modalTitle.innerText = "Manage Filters";
		this.modalTitle.style.color = "#fcfcfc";
		this.modalTitle.style.textAlign = "center";

		this.modalContent = document.createElement("div");
		this.modalContent.style.flex = "1";
		this.modalContent.style.borderRadius = "8px";
		this.modalContent.style.padding = "10px";
		this.modalContent.style.overflowY = "auto";

		this.selectAllButton = createButton({
			text: "Select All",
			size: "mini",
			onclick: () => {
				this.filterManager.selectAll(this.searchBucket);
				this.updateModalContent();
				this.updateSelectedCount();
			},
		});

		this.deselectAllButton = createButton({
			text: "Deselect All",
			size: "mini",
			onclick: () => {
				this.filterManager.deselectAll(this.searchBucket);
				this.updateModalContent();
				this.updateSelectedCount();
			},
		});

		this.modalClearAllButton = createButton({
			text: "Clear All",
			size: "mini",
			variant: "danger",
			onclick: () => {
				this.filterManager.clearAll(this.searchBucket);
				this.updateModalContent();
				this.updateSelectedCount();
			},
		});

		this.modalCloseButton = createButton({
			text: "Close",
			size: "mini",
			onclick: () => {
				this.modal.style.display = "none";
			},
		});

		const selectionButtonContainer = document.createElement("div");
		selectionButtonContainer.classList.add("button-container");
		selectionButtonContainer.style.padding = "10px 10px 0 10px";
		selectionButtonContainer.appendChild(this.selectAllButton);
		selectionButtonContainer.appendChild(this.deselectAllButton);

		const modalButtonContainer = document.createElement("div");
		modalButtonContainer.classList.add("button-container");
		modalButtonContainer.style.padding = "10px";
		modalButtonContainer.appendChild(this.modalClearAllButton);
		modalButtonContainer.appendChild(this.modalCloseButton);

		this.modal.appendChild(this.modalTitle);
		this.modal.appendChild(selectionButtonContainer);
		this.modal.appendChild(this.modalContent);
		this.modal.appendChild(modalButtonContainer);
	}

	private updateModalContent() {
		this.modalContent.innerHTML = "";

		const currentFilters = this.filterManager.filters.filter((f) => f.searchBucket === this.searchBucket);

		if (currentFilters.length === 0) {
			const emptyMessage = document.createElement("div");
			emptyMessage.textContent = "No filters saved yet";
			emptyMessage.style.color = "#888";
			emptyMessage.style.textAlign = "center";
			emptyMessage.style.padding = "20px";
			this.modalContent.appendChild(emptyMessage);
			return;
		}

		currentFilters.forEach((filter) => {
			const filterItem = document.createElement("div");
			filterItem.style.padding = "8px";
			filterItem.style.marginBottom = "5px";
			filterItem.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
			filterItem.style.borderRadius = "4px";
			filterItem.style.color = "#fcfcfc";
			filterItem.style.display = "flex";
			filterItem.style.justifyContent = "space-between";
			filterItem.style.alignItems = "center";

			const leftContainer = document.createElement("div");
			leftContainer.style.display = "flex";
			leftContainer.style.alignItems = "center";
			leftContainer.style.flex = "1";
			leftContainer.style.gap = "8px";

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = this.filterManager.isSelected(filter.id, this.searchBucket);
			checkbox.style.cssText = `
				width: 16px;
				height: 16px;
				cursor: pointer;
				accent-color: #1fc3c1;
			`;
			checkbox.addEventListener("change", () => {
				this.filterManager.toggleSelection(filter.id, this.searchBucket);
				this.updateSelectedCount();
			});

			const filterName = document.createElement("span");
			filterName.textContent = filter.name;
			filterName.style.flex = "1";
			filterName.style.cursor = "pointer";
			filterName.onclick = () => {
				this.filterManager.select(filter.id);
				this.modal.style.display = "none";
			};

			leftContainer.appendChild(checkbox);
			leftContainer.appendChild(filterName);

			const buttonContainer = document.createElement("div");
			buttonContainer.style.display = "flex";
			buttonContainer.style.gap = "5px";

			const editButton = createButton({
				text: "✎",
				size: "mini",
				onclick: () => {
					this.enterEditMode(filter.id);
				},
			});
			editButton.style.minWidth = "24px";
			editButton.style.height = "24px";
			editButton.style.padding = "0";
			editButton.style.fontSize = "14px";
			editButton.style.lineHeight = "1";

			const removeButton = createButton({
				text: "×",
				size: "mini",
				variant: "danger",
				onclick: () => {
					this.filterManager.remove(filter.id);
					this.updateModalContent();
					this.updateSelectedCount();
				},
			});
			removeButton.style.minWidth = "24px";
			removeButton.style.height = "24px";
			removeButton.style.padding = "0";
			removeButton.style.fontSize = "16px";
			removeButton.style.lineHeight = "1";

			buttonContainer.appendChild(editButton);
			buttonContainer.appendChild(removeButton);

			filterItem.appendChild(leftContainer);
			filterItem.appendChild(buttonContainer);
			this.modalContent.appendChild(filterItem);
		});
	}

	private enterEditMode(filterId: string) {
		this.editingFilterId = filterId;
		this.manageFiltersButton.textContent = "Cancel";
		this.saveFilterButton.textContent = "Update";
		this.modal.style.display = "none";
		this.filterManager.select(filterId);
	}

	private exitEditMode() {
		this.editingFilterId = null;
		this.manageFiltersButton.textContent = "Filters";
		this.saveFilterButton.textContent = "Save";
	}

	private updateSelectedCount() {
		const selectedCount = this.filterManager.getSelectedCount(this.searchBucket);
		const totalCount = this.filterManager.getTotalCount(this.searchBucket);
		this.selectedFiltersButton.textContent = `Selected (${selectedCount}/${totalCount})`;
	}

	constructor(private filterManager: FilterManager) {
		this.createbuttonContainer();
		this.createModal();
		this.updateSelectedCount();
	}

	getSearchBucket() {
		return this.searchBucket;
	}

	getFilters() {
		return this.filterManager.getFilters(this.searchBucket);
	}

	onSearchBucket = (searchBucket: SearchBucket) => {
		if (this.editingFilterId) this.exitEditMode();
		this.searchBucket = searchBucket;
		this.updateModalContent();
		this.updateSelectedCount();
	};

	init = (container: HTMLElement) => {
		container.appendChild(this.buttonContainer);
		container.appendChild(this.modal);
	};
}

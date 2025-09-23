import { createButton, createStaticButton } from "~/components/button";
import { FilterManager } from "~/managers/filterManager";
import { SearchBucket } from "~/types/fc";

export class FilterService {
	private filterManager: FilterManager;

	private buttonContainer: HTMLElement;
	private saveFilterButton: HTMLButtonElement;
	private manageFiltersButton: HTMLButtonElement;
	private selectedFiltersButton: HTMLButtonElement;

	private modal: HTMLElement;
	private modalTitle: HTMLHeadingElement;
	private modalContent: HTMLElement;
	private modalCloseButton: HTMLButtonElement;
	private modalClearAllButton: HTMLButtonElement;

	private searchBucket: SearchBucket = SearchBucket.PLAYER;
	private editingFilterId: string | null = null;

	private createbuttonContainer() {
		this.buttonContainer = document.createElement("div");
		this.buttonContainer.classList.add("button-container");

		this.manageFiltersButton = createButton({
			value: "Filters",
			size: "mini",
			onclick: () => {
				if (this.editingFilterId) {
					this.exitEditMode();
				} else {
					this.updateModalContent();
					this.modal.style.display = "flex";
				}
			},
		});

		this.saveFilterButton = createButton({
			value: "Save",
			size: "mini",
			variant: "primary",
			onclick: () => {
				if (this.editingFilterId) {
					this.filterManager.update(this.editingFilterId, this.searchBucket);
					this.exitEditMode();
				} else {
					this.filterManager.save(this.searchBucket);
					this.saveFilterButton.textContent = "Saved!";
					setTimeout(() => {
						this.saveFilterButton.textContent = "Save";
					}, 1500);
				}
			},
		});

		this.selectedFiltersButton = createStaticButton({
			value: "Selected (0)",
			size: "mini",
			style: {
				flex: "unset",
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

		this.modalClearAllButton = createButton({
			value: "Clear All",
			size: "mini",
			variant: "danger",
			onclick: () => {
				this.filterManager.clearAll(this.searchBucket);
				this.updateModalContent();
			},
		});

		this.modalCloseButton = createButton({
			value: "Close",
			size: "mini",
			onclick: () => {
				this.modal.style.display = "none";
			},
		});

		const modalButtonContainer = document.createElement("div");
		modalButtonContainer.classList.add("button-container");
		modalButtonContainer.style.padding = "10px";
		modalButtonContainer.appendChild(this.modalClearAllButton);
		modalButtonContainer.appendChild(this.modalCloseButton);

		this.modal.appendChild(this.modalTitle);
		this.modal.appendChild(this.modalContent);
		this.modal.appendChild(modalButtonContainer);
	}

	private updateModalContent() {
		this.modalContent.innerHTML = "";

		const currentFilters = this.filterManager.filters.filter(f => f.searchBucket === this.searchBucket);

		if (currentFilters.length === 0) {
			const emptyMessage = document.createElement("div");
			emptyMessage.textContent = "No filters saved yet";
			emptyMessage.style.color = "#888";
			emptyMessage.style.textAlign = "center";
			emptyMessage.style.padding = "20px";
			this.modalContent.appendChild(emptyMessage);
			return;
		}

		currentFilters.forEach(filter => {
			const filterItem = document.createElement("div");
			filterItem.style.padding = "8px";
			filterItem.style.marginBottom = "5px";
			filterItem.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
			filterItem.style.borderRadius = "4px";
			filterItem.style.color = "#fcfcfc";
			filterItem.style.display = "flex";
			filterItem.style.justifyContent = "space-between";
			filterItem.style.alignItems = "center";

			const filterName = document.createElement("span");
			filterName.textContent = filter.name;
			filterName.style.flex = "1";
			filterName.style.cursor = "pointer";
			filterName.onclick = () => {
				this.filterManager.select(filter.id);
				this.modal.style.display = "none";
			};

			const buttonContainer = document.createElement("div");
			buttonContainer.style.display = "flex";
			buttonContainer.style.gap = "5px";

			const editButton = createButton({
				value: "✎",
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
				value: "×",
				size: "mini",
				variant: "danger",
				onclick: () => {
					this.filterManager.remove(filter.id);
					this.updateModalContent();
				},
			});
			removeButton.style.minWidth = "24px";
			removeButton.style.height = "24px";
			removeButton.style.padding = "0";
			removeButton.style.fontSize = "16px";
			removeButton.style.lineHeight = "1";

			buttonContainer.appendChild(editButton);
			buttonContainer.appendChild(removeButton);

			filterItem.appendChild(filterName);
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

	constructor() {
		this.filterManager = new FilterManager();
		this.createbuttonContainer();
		this.createModal();
	}

	onSearchBucket = (searchBucket: SearchBucket) => {
		this.searchBucket = searchBucket;
		this.updateModalContent();
	};

	init = (container: HTMLElement) => {
		container.appendChild(this.buttonContainer);
		container.appendChild(this.modal);
	};
}

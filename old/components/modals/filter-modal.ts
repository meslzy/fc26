import { FilterManager } from "~/core/filters/filter-manager";

export class FilterModalManager {
	private filterManager: FilterManager;

	constructor(filterManager: FilterManager) {
		this.filterManager = filterManager;
	}

	createFilterModal(context: any): void {
		const modal = document.createElement("div");
		modal.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: #2a2a2a;
			border: 2px solid #00ff88;
			border-radius: 8px;
			padding: 20px;
			z-index: 10000;
			max-width: 600px;
			max-height: 500px;
			overflow-y: auto;
			box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
		`;

		const title = document.createElement("h3");
		const selectedCount = this.filterManager.getSelectedCount();
		const editingFilter = this.filterManager.getEditingFilterId()
			? this.filterManager.getFilterById(
					this.filterManager.getEditingFilterId()!,
				)
			: null;

		if (editingFilter) {
			title.textContent = `Editing: ${editingFilter.description}`;
			title.style.cssText =
				"color: #ff6600; margin: 0 0 15px 0; font-size: 16px;";
		} else {
			title.textContent = `Saved Filters (${selectedCount}/${this.filterManager.getFilterCount()} selected)`;
			title.style.cssText =
				"color: #00ff88; margin: 0 0 15px 0; font-size: 16px;";
		}

		const selectionControls = this.createSelectionControls(context, modal);
		const filterList = this.createFilterList(context, modal);
		const footer = this.createFooter(context, modal);

		modal.appendChild(title);
		modal.appendChild(selectionControls);
		modal.appendChild(filterList);
		modal.appendChild(footer);

		document.body.appendChild(modal);
	}

	private createSelectionControls(
		context: any,
		modal: HTMLElement,
	): HTMLElement {
		const selectionControls = document.createElement("div");
		selectionControls.style.cssText =
			"display: flex; gap: 10px; margin-bottom: 15px;";

		if (this.filterManager.isEditing()) {
			const cancelEditBtn = document.createElement("button");
			cancelEditBtn.textContent = "Cancel Edit";
			cancelEditBtn.style.cssText = `
				background: #666;
				color: white;
				border: none;
				padding: 6px 12px;
				border-radius: 4px;
				cursor: pointer;
				font-size: 11px;
			`;

			cancelEditBtn.addEventListener("click", () => {
				this.filterManager.cancelEditing();
				context.updateFilterButtons?.();
				document.body.removeChild(modal);
				this.createFilterModal(context);
			});

			selectionControls.appendChild(cancelEditBtn);
		} else {
			const selectAllBtn = this.createButton(
				"Select All",
				"#00ff88",
				"black",
				() => {
					this.filterManager.selectAllFilters();
					context.updateFilterButtons?.();
					document.body.removeChild(modal);
					this.createFilterModal(context);
				},
			);

			const clearSelectionBtn = this.createButton(
				"Clear Selection",
				"#ff6600",
				"white",
				() => {
					this.filterManager.clearSelection();
					context.updateFilterButtons?.();
					document.body.removeChild(modal);
					this.createFilterModal(context);
				},
			);

			selectionControls.appendChild(selectAllBtn);
			selectionControls.appendChild(clearSelectionBtn);
		}

		return selectionControls;
	}

	private createFilterList(context: any, modal: HTMLElement): HTMLElement {
		const filterList = document.createElement("div");
		filterList.style.cssText =
			"display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;";

		this.filterManager.getAllFilters().forEach((filter, index) => {
			const filterRow = this.createFilterRow(filter, index, context, modal);
			filterList.appendChild(filterRow);
		});

		return filterList;
	}

	private createFilterRow(
		filter: any,
		index: number,
		context: any,
		modal: HTMLElement,
	): HTMLElement {
		const filterRow = document.createElement("div");
		const isSelected = this.filterManager.isFilterSelected(index);

		filterRow.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px;
			background: ${isSelected ? "#2d4a2d" : "#333"};
			border: ${isSelected ? "1px solid #00ff88" : "1px solid transparent"};
			border-radius: 4px;
			color: white;
			font-size: 12px;
		`;

		const leftSection = this.createFilterRowLeft(filter, index, context, modal);
		const buttonGroup = this.createFilterRowButtons(
			filter,
			index,
			context,
			modal,
		);

		filterRow.appendChild(leftSection);
		filterRow.appendChild(buttonGroup);

		return filterRow;
	}

	private createFilterRowLeft(
		filter: any,
		index: number,
		context: any,
		modal: HTMLElement,
	): HTMLElement {
		const leftSection = document.createElement("div");
		leftSection.style.cssText =
			"display: flex; align-items: center; gap: 8px; flex: 1;";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.checked = this.filterManager.isFilterSelected(index);
		checkbox.style.cssText = `
			width: 14px;
			height: 14px;
			accent-color: #00ff88;
			cursor: pointer;
		`;

		checkbox.addEventListener("change", () => {
			this.filterManager.toggleFilterSelection(index);
			context.updateFilterButtons?.();
			document.body.removeChild(modal);
			this.createFilterModal(context);
		});

		const filterText = document.createElement("span");
		filterText.textContent = filter.description;
		filterText.style.flex = "1";

		leftSection.appendChild(checkbox);
		leftSection.appendChild(filterText);

		return leftSection;
	}

	private createFilterRowButtons(
		filter: any,
		index: number,
		context: any,
		modal: HTMLElement,
	): HTMLElement {
		const buttonGroup = document.createElement("div");
		buttonGroup.style.cssText = "display: flex; gap: 5px;";

		const selectBtn = this.createSmallButton(
			"Select",
			"#00ff88",
			"black",
			() => {
				this.filterManager.loadFilter(filter);
				document.body.removeChild(modal);
			},
		);

		const editBtn = this.createSmallButton("Edit", "#ff6600", "white", () => {
			this.filterManager.setEditingFilterId(filter.id);
			this.filterManager.loadFilter(filter);
			context.updateFilterButtons?.();
			document.body.removeChild(modal);
		});

		const deleteBtn = this.createSmallButton(
			"Delete",
			"#ff4444",
			"white",
			() => {
				this.filterManager.deleteFilter(index);
				context.updateFilterButtons?.();
				document.body.removeChild(modal);
			},
		);

		buttonGroup.appendChild(selectBtn);
		buttonGroup.appendChild(editBtn);
		buttonGroup.appendChild(deleteBtn);

		return buttonGroup;
	}

	private createFooter(context: any, modal: HTMLElement): HTMLElement {
		const footer = document.createElement("div");
		footer.style.cssText =
			"display: flex; gap: 10px; justify-content: flex-end;";

		const clearAllBtn = this.createButton(
			"Clear All",
			"#ff6600",
			"white",
			() => {
				this.filterManager.clearAllFilters();
				context.updateFilterButtons?.();
				document.body.removeChild(modal);
			},
		);

		const closeBtn = this.createButton("Close", "#666", "white", () => {
			document.body.removeChild(modal);
		});

		footer.appendChild(clearAllBtn);
		footer.appendChild(closeBtn);

		return footer;
	}

	private createButton(
		text: string,
		bg: string,
		color: string,
		onClick: () => void,
	): HTMLElement {
		const button = document.createElement("button");
		button.textContent = text;
		button.style.cssText = `
			background: ${bg};
			color: ${color};
			border: none;
			padding: 8px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 11px;
		`;
		button.addEventListener("click", onClick);
		return button;
	}

	private createSmallButton(
		text: string,
		bg: string,
		color: string,
		onClick: () => void,
	): HTMLElement {
		const button = document.createElement("button");
		button.textContent = text;
		button.style.cssText = `
			background: ${bg};
			color: ${color};
			border: none;
			padding: 4px 8px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 10px;
		`;
		button.addEventListener("click", onClick);
		return button;
	}
}

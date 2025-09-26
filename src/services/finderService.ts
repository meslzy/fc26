import { createButton } from "~/components/button";
import { SearchBucket } from "~/core/bucket";
import type { SearchManager } from "~/managers/searchManager";
import type { LoggerService } from "./loggerService";

export class FinderService {
	private finderButton: HTMLButtonElement;
	private modal: HTMLElement;
	private modalTitle: HTMLHeadingElement;
	private modalContent: HTMLElement;
	private findMinButton: HTMLButtonElement;
	private modalCloseButton: HTMLButtonElement;

	private isSearching: boolean = false;

	private createFinderButton() {
		this.finderButton = createButton({
			value: "Finder",
			variant: "utility",
			style: {
				flex: "unset",
			},
			onclick: () => {
				this.modal.style.display = "flex";
			},
		});
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
		this.modalTitle.innerText = "Finder";
		this.modalTitle.style.color = "#fcfcfc";
		this.modalTitle.style.textAlign = "center";

		this.createModalContent();

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
		modalButtonContainer.appendChild(this.modalCloseButton);

		this.modal.appendChild(this.modalTitle);
		this.modal.appendChild(this.modalContent);
		this.modal.appendChild(modalButtonContainer);
	}

	private updateButtonState() {
		if (this.isSearching) {
			this.findMinButton.textContent = "Cancel";
			this.findMinButton.classList.add("danger");
		} else {
			this.findMinButton.textContent = "Find the minimum max buy";
			this.findMinButton.classList.remove("danger");
		}
	}

	private handleButtonClick() {
		if (this.isSearching) {
			this.cancelSearch();
		} else {
			this.startSearch();
		}
	}

	private cancelSearch() {
		this.isSearching = false;
		this.updateButtonState();
		this.loggerService.addLog("Search cancelled", "warning");
	}

	private startSearch() {
		this.isSearching = true;
		this.updateButtonState();
		this.loggerService.addLog("Starting minimum max buy search...", "info");
		this.performSearch();
	}

	private performSearch() {
		const searchCriteria = this.searchManager.getSearchCriteria();

		const utSearchCriteria = new UTSearchCriteriaDTO();
		Object.assign(utSearchCriteria, searchCriteria);

		const searchModel = new UTBucketedItemSearchViewModel();
		searchModel.searchBucket = SearchBucket.PLAYER;
		searchModel.searchFeature = "market";
		searchModel.updateSearchCriteria(utSearchCriteria);

		services.Item.clearTransferMarketCache();

		services.Item.searchTransferMarket(
			searchModel.searchCriteria,
			1,
		).observe(this, (_, response) => {
			this.handleSearchResponse(response);
		});
	}

	private handleSearchResponse(response: any) {
		this.isSearching = false;
		this.updateButtonState();

		this.loggerService.addLog(
			`Search response: ${JSON.stringify(response)}`,
			"info"
		);

		if (response.success) {
			this.loggerService.addLog("Search completed successfully", "success");
		} else {
			this.loggerService.addLog("Search failed", "error");
		}
	}

	private createModalContent() {
		this.modalContent = document.createElement("div");
		this.modalContent.style.flex = "1";
		this.modalContent.style.borderRadius = "8px";
		this.modalContent.style.padding = "10px";
		this.modalContent.style.display = "flex";
		this.modalContent.style.alignItems = "center";
		this.modalContent.style.justifyContent = "center";

		this.findMinButton = createButton({
			value: "Find the minimum max buy",
			size: "mini",
			variant: "secondary",
			onclick: () => this.handleButtonClick(),
		});

		this.modalContent.appendChild(this.findMinButton);
	}

	constructor(
		private searchManager: SearchManager,
		private loggerService: LoggerService,
	) {
		this.createFinderButton();
		this.createModal();
	}

	init = (container: HTMLElement) => {
		const buttonContainer = container.querySelector(".button-container");
		buttonContainer.appendChild(this.finderButton);
		container.appendChild(this.modal);
	};
}

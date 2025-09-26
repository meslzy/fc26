import { createButton } from "~/components/button";
import { SearchBucket } from "~/core/bucket";
import { getNextLowerValidPrice } from "~/core/price";
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
	private consecutiveFailures = 0;
	private lastFoundPrices: number[] = [];
	private currentMaxPrice: number | null = null;

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
		this.consecutiveFailures = 0;
		this.lastFoundPrices = [];
		this.currentMaxPrice = null;
		this.loggerService.addLog("Starting minimum max buy search...", "info");
		this.performSearch();
	}

	private sendPinEvents(pageId: string) {
		services.PIN.sendData(PINEventType.PAGE_VIEW, {
			type: PIN_PAGEVIEW_EVT_TYPE,
			pgid: pageId,
		});
	}

	private performSearch(sendSearchEvent: boolean = false) {
		if (!this.isSearching) return;

		if (sendSearchEvent) {
			this.sendPinEvents("Transfer Market Search");
		}

		const searchCriteria = this.searchManager.getSearchCriteria();

		const utSearchCriteria = new UTSearchCriteriaDTO();
		Object.assign(utSearchCriteria, searchCriteria);

		if (this.currentMaxPrice !== null) {
			utSearchCriteria.maxBuy = this.currentMaxPrice;
		}

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

	private handleSearchError(response: any): boolean {
		let shouldStop = false;

		if (
			response.status === "CAPTCHA_REQUIRED" ||
			(response.error && response.error.code === "CAPTCHA_REQUIRED") ||
			response.status === 521 ||
			response.status === 429
		) {
			shouldStop = true;
			this.loggerService.addLog("🤖 CAPTCHA detected - stopping finder", "error");
		} else if (response.status === 512 || response.status === 503) {
			shouldStop = true;
			this.loggerService.addLog("Server maintenance detected - stopping finder", "error");
		} else {
			this.consecutiveFailures++;

			if (this.consecutiveFailures >= 3) {
				shouldStop = true;
				this.loggerService.addLog(
					`Search failed ${this.consecutiveFailures} times consecutively - stopping`,
					"error"
				);
			} else {
				this.loggerService.addLog(
					`Search failed (${this.consecutiveFailures}/3) - Status: ${response.status}`,
					"error"
				);
			}
		}

		if (shouldStop) {
			this.isSearching = false;
			this.updateButtonState();
			return true;
		}

		return false;
	}

	private displayLowestPrices() {
		if (this.lastFoundPrices.length === 0) {
			this.loggerService.addLog("No items found with buy now prices", "warning");
			return;
		}

		const sortedPrices = this.lastFoundPrices.sort((a, b) => a - b);
		const lowest3 = sortedPrices.slice(0, 3);

		this.loggerService.addLog("=== Lowest Buy Now Prices ===", "info");

		lowest3.forEach((price, index) => {
			this.loggerService.addLog(`${index + 1}. ${price.toLocaleString()} coins`, "success");
		});
	}

	private handleSearchResponse(response: any) {
		if (!this.isSearching) return;

		if (!response.success && this.handleSearchError(response)) {
			return;
		}

		this.sendPinEvents("Transfer Market Results - List View");

		if (!response.success || !response.data?.items) {
			if (this.lastFoundPrices.length > 0) {
				this.loggerService.addLog("No more items found - using last found prices", "warning");
				this.displayLowestPrices();
			} else {
				this.loggerService.addLog("No items found in search", "warning");
			}
			this.isSearching = false;
			this.updateButtonState();
			return;
		}

		const items = response.data.items;

		const buyPrices = items
			.filter(item => item._auction && item._auction.tradeState === "active")
			.map(item => item._auction.buyNowPrice)
			.filter(price => price != null && price > 0);

		if (buyPrices.length === 0) {
			this.loggerService.addLog("No items with buy now prices found", "warning");
			this.isSearching = false;
			this.updateButtonState();
			return;
		}

		this.lastFoundPrices = buyPrices;
		this.consecutiveFailures = 0;

		this.loggerService.addLog(`Found ${items.length} items`, "info");

		if (items.length > 20) {
			const lowestPrice = Math.min(...buyPrices);
			this.currentMaxPrice = getNextLowerValidPrice(lowestPrice);
			this.loggerService.addLog(`Refining search to max buy of ${this.currentMaxPrice.toLocaleString()}`, "info");
			setTimeout(() => this.performSearch(true), 2000);
		} else {
			this.displayLowestPrices();
			this.isSearching = false;
			this.updateButtonState();
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

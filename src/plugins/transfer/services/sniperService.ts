import { getNextLowerValidPrice } from "~/composables/price";
import type { AudioService } from "~/services/audioService";
import type { LoggerService } from "~/services/loggerService";
import type { StaticService } from "~/services/staticService";
import type { Filter } from "../managers/filterManager";
import type { Settings } from "../managers/settingsManager";
import type { FilterService } from "./filterService";
import type { SettingsService } from "./settingsServices";

export enum SniperState {
	STOP,
	START,
}

export class SniperService {
	private buttonContainer: HTMLElement;
	private startButton: HTMLButtonElement;
	private stopButton: HTMLButtonElement;
	private settingsButton: HTMLButtonElement;

	private state: SniperState = SniperState.STOP;
	private interval: NodeJS.Timeout | null = null;

	private searchCounter = 0;
	private cycleCount = 0;
	private currentFilterIndex = 0;

	private consecutiveFailures = 0;
	private seenTradeIds = new Set<number>();

	private updateButtonStates() {
		if (this.state === SniperState.START) {
			this.startButton.classList.add("disabled");
			this.startButton.disabled = true;
			this.stopButton.classList.remove("disabled");
			this.stopButton.disabled = false;
		} else {
			this.startButton.classList.remove("disabled");
			this.startButton.disabled = false;
			this.stopButton.classList.add("disabled");
			this.stopButton.disabled = true;
		}
	}

	private generateSingleValues(limit: number, startValue: number): number[] {
		const values = [0];

		for (let i = startValue; i <= limit; i += i >= 1000 ? 1000 : 50) {
			values.push(i);
		}

		return values;
	}

	private generateBothCombinations(bidLimit: number, buyLimit: number): Array<{ minBid: number; minBuy: number }> {
		const combinations: Array<{ minBid: number; minBuy: number }> = [];
		const bidValues = this.generateSingleValues(bidLimit, 150);
		const buyValues = this.generateSingleValues(buyLimit, 200);

		for (const bid of bidValues) {
			for (const buy of buyValues) {
				combinations.push({ minBid: bid, minBuy: buy });
			}
		}

		return combinations;
	}

	private applyCachePrevention(settings: Settings, searchCriteria: SearchCriteria) {
		const bidEnabled = settings.search.randomMinBid.enabled;
		const buyEnabled = settings.search.randomMinBuy.enabled;

		if (!bidEnabled && !buyEnabled) {
			const bidLimit = 300;
			const buyLimit = 300;
			const combinations = this.generateBothCombinations(bidLimit, buyLimit);
			const combination = combinations[this.searchCounter % combinations.length];
			searchCriteria.minBid = combination.minBid;
			searchCriteria.minBuy = combination.minBuy;
		} else if (bidEnabled && buyEnabled) {
			const bidLimit = settings.search.randomMinBid.amount;
			const buyLimit = settings.search.randomMinBuy.amount;
			const combinations = this.generateBothCombinations(bidLimit, buyLimit);
			const combination = combinations[this.searchCounter % combinations.length];
			searchCriteria.minBid = combination.minBid;
			searchCriteria.minBuy = combination.minBuy;
		} else if (bidEnabled) {
			const bidLimit = settings.search.randomMinBid.amount;
			const values = this.generateSingleValues(bidLimit, 150);
			searchCriteria.minBid = values[this.searchCounter % values.length];
		} else if (buyEnabled) {
			const buyLimit = settings.search.randomMinBuy.amount;
			const values = this.generateSingleValues(buyLimit, 200);
			searchCriteria.minBuy = values[this.searchCounter % values.length];
		}
	}

	private handleSearchError(response: any): boolean {
		let shouldStopBot = false;

		if (
			response.status === "CAPTCHA_REQUIRED" ||
			(response.error && response.error.code === "CAPTCHA_REQUIRED") ||
			response.status === 521 ||
			response.status === 429
		) {
			shouldStopBot = true;
			this.loggerService.addLog("🤖 CAPTCHA detected - stopping sniper", "error");
			if (this.settingsService.settings.search.enableErrorSound) {
				this.audioService.error();
			}
		} else if (response.status === 512 || response.status === 503) {
			shouldStopBot = true;
			this.loggerService.addLog("Server maintenance detected - stopping sniper", "error");
			if (this.settingsService.settings.search.enableErrorSound) {
				this.audioService.error();
			}
		} else {
			this.consecutiveFailures++;

			if (this.consecutiveFailures >= 3) {
				shouldStopBot = true;
				this.loggerService.addLog(
					`Search failed ${this.consecutiveFailures} times consecutively - auto-stopping`,
					"error",
				);
				if (this.settingsService.settings.search.enableErrorSound) {
					this.audioService.error();
				}
			} else {
				this.loggerService.addLog(
					`Search failed (${this.consecutiveFailures}/${3}) - Status: ${response.status}`,
					"error",
				);
			}
		}

		if (shouldStopBot) {
			this.stop();
			return true;
		}

		return false;
	}

	private buyItem(item: any, price: number, settings: Settings, filter: Filter) {
		if (settings.search.enableDryBuy) {
			this.loggerService.addLog(`${filter.name}: ${price} | dry buy, not actually buying`, "success");
			if (this.settingsService.settings.search.enableWinSound) {
				this.audioService.win();
			}
			return;
		}

		services.Item.bid(item, price).observe(this, (_, data) => {
			if (!data.success) {
				this.loggerService.addLog(`${filter.name}: ${price} | buy failed`, "error");
				if (this.settingsService.settings.search.enableErrorSound) {
					this.audioService.fail();
				}
				this.staticService.increment("Fails");
				return;
			}

			this.staticService.increment("Wins");

			if (this.settingsService.settings.search.enableWinSound) {
				this.audioService.win();
			}

			const sellPrice = filter.searchCriteria.sellPrice;

			if (sellPrice > 0) {
				this.loggerService.addLog(`${filter.name}: ${price} | bought - will sell for ${sellPrice}`, "success");
			} else {
				this.loggerService.addLog(`${filter.name}: ${price} | bought | ${sellPrice}`, "success");
			}

			if (sellPrice > 0) {
				if (repositories.Item.isPileFull(ItemPile.TRANSFER)) {
					this.loggerService.addLog("Transfer pile is full, cannot list item", "warning");
					return;
				}

				setTimeout(() => {
					services.Item.list(item, getNextLowerValidPrice(sellPrice), sellPrice, 3600).observe(this, () => {
						this.loggerService.addLog(`Item listed for ${sellPrice}`, "info");
					});
				}, 1000);
			}
		});
	}

	private processSearchResults(items: any[], settings: Settings, filter: Filter) {
		if (items.length > 5) {
			this.loggerService.addLog(
				`SAFEGUARD: Too many results (${items.length}) - STOPPING to prevent mass buying!`,
				"error",
			);
			if (this.settingsService.settings.search.enableErrorSound) {
				this.audioService.error();
			}
			this.stop();
			return;
		}

		for (const item of items) {
			const auction = item._auction;
			const buyNowPrice = auction.buyNowPrice;
			const tradeId = auction.tradeId;

			if (this.seenTradeIds.has(tradeId)) {
				continue;
			}

			this.seenTradeIds.add(tradeId);

			this.buyItem(item, buyNowPrice, settings, filter);
		}
	}

	private handleSearchResponse(
		response: any,
		searchBucket: SearchBucket,
		filters: Filter[],
		settings: Settings,
		currentFilter: Filter,
	) {
		if (this.state === SniperState.STOP) {
			return;
		}

		if (!response.success && this.handleSearchError(response)) {
			return;
		}

		sendPinEvents("Transfer Market Results - List View");

		this.processSearchResults(response.data.items, settings, currentFilter);

		this.staticService.increment("Searches");
		this.consecutiveFailures = 0;
		this.searchCounter += 1;
		this.cycleCount += 1;

		const enabledCycles = settings.safety.enabledCycles;

		const cyclesCount = Math.floor(
			Math.random() * (settings.safety.cyclesCount.max - settings.safety.cyclesCount.min + 1) +
				settings.safety.cyclesCount.min,
		);

		if (enabledCycles && this.cycleCount >= cyclesCount) {
			const { min, max } = settings.safety.delayBetweenCycles;

			const delayBetweenCycles = Math.floor(Math.random() * (max - min + 1) + min) * 1000;

			this.loggerService.addLog(
				`Cycle limit reached - pausing for ${(delayBetweenCycles / 1000).toLocaleString()}s`,
				"info",
			);

			this.cycleCount = 0;

			if (settings.search.filterRotation === "per-cycle") {
				this.currentFilterIndex++;
			}

			this.interval = setTimeout(() => {
				const coins = getUserCoins().toLocaleString();

				this.loggerService.addLog(`Resuming sniper! Coins: ${coins}, Using ${filters.length} filters`, "info");

				sendPinEvents("Transfer Market Search");
				this.performSearch(searchBucket, filters, settings);
			}, delayBetweenCycles);
		} else {
			const delayBetweenSearches =
				Math.floor(
					Math.random() * (settings.safety.delayBetweenSearches.max - settings.safety.delayBetweenSearches.min + 1) +
						settings.safety.delayBetweenSearches.min,
				) * 1000;

			this.interval = setTimeout(() => {
				sendPinEvents("Transfer Market Search");
				this.performSearch(searchBucket, filters, settings);
			}, delayBetweenSearches);
		}
	}

	private selectFilter(filters: Filter[], settings: Settings): Filter {
		const rotation = settings.search.filterRotation;

		if (rotation === "random") {
			return filters[Math.floor(Math.random() * filters.length)];
		}

		if (rotation === "per-cycle") {
			return filters[this.currentFilterIndex % filters.length];
		}

		return filters[this.searchCounter % filters.length];
	}

	private performSearch(searchBucket: SearchBucket, filters: Filter[], settings: Settings) {
		if (this.state === SniperState.STOP) {
			return;
		}

		const currentFilter = this.selectFilter(filters, settings);
		const searchCriteria = currentFilter.searchCriteria;

		const utSearchCriteria = new UTSearchCriteriaDTO();
		Object.assign(utSearchCriteria, searchCriteria);

		const searchModel = new UTBucketedItemSearchViewModel();
		searchModel.searchBucket = searchBucket;
		searchModel.searchFeature = "market";
		searchModel.updateSearchCriteria(utSearchCriteria);

		this.applyCachePrevention(settings, searchModel.searchCriteria);

		services.Item.clearTransferMarketCache();

		services.Item.searchTransferMarket(searchModel.searchCriteria, 1).observe(this, (_, response) =>
			this.handleSearchResponse(response, searchBucket, filters, settings, currentFilter),
		);
	}

	private start() {
		if (this.state === SniperState.START) {
			this.loggerService.addLog("Sniper is already started!", "warning");
			return;
		}

		this.state = SniperState.START;

		this.updateButtonStates();

		const coins = getUserCoins().toLocaleString();
		const searchBucket = this.filterService.getSearchBucket();
		const filters = this.filterService.getFilters();
		const settings = this.settingsService.getSettings();

		this.loggerService.addLog(`Sniper started! Coins: ${coins}, Using ${filters.length} filters`, "info");

		this.searchCounter = 0;
		this.cycleCount = 0;
		this.currentFilterIndex = 0;
		this.consecutiveFailures = 0;
		this.seenTradeIds.clear();

		this.performSearch(searchBucket, filters, settings);
	}

	private stop() {
		if (this.state === SniperState.STOP) {
			this.loggerService.addLog("Sniper is already stopped!", "warning");
			return;
		}

		this.state = SniperState.STOP;

		this.updateButtonStates();

		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}

		this.loggerService.addLog("Sniper stopped!", "warning");
	}

	private createButtonContainer() {
		this.buttonContainer = document.createElement("div");
		this.buttonContainer.classList.add("button-container");
		this.buttonContainer.style.borderRadius = "16px";

		this.stopButton = createButton({
			text: "Stop",
			size: "mini",
			variant: "danger",
			onclick: () => this.stop(),
		});

		this.startButton = createButton({
			text: "Start",
			size: "mini",
			variant: "primary",
			onclick: () => this.start(),
		});

		this.settingsButton = createButton({
			text: "Settings",
			size: "mini",
			style: {
				flex: "none",
			},
			onclick: () => this.settingsService.showSettings(),
		});

		this.buttonContainer.appendChild(this.stopButton);
		this.buttonContainer.appendChild(this.startButton);
		this.buttonContainer.appendChild(this.settingsButton);
	}

	constructor(
		private audioService: AudioService,
		private filterService: FilterService,
		private staticService: StaticService,
		private loggerService: LoggerService,
		private settingsService: SettingsService,
	) {
		this.createButtonContainer();
	}

	init = (container: HTMLElement) => {
		container.appendChild(this.buttonContainer);
		this.updateButtonStates();
	};
}

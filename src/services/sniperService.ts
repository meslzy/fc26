import { createButton } from "~/components/button";
import type { SearchBucket } from "~/core/bucket";
import type { SearchCriteria } from "~/managers/searchManager";
import type { Settings } from "~/managers/settingsManager";
import type { AudioService } from "~/services/audioService";
import type { UserService } from "~/services/userService";
import type { FilterService } from "./filterService";
import type { LoggerService } from "./loggerService";
import type { SettingsService } from "./settingsServices";
import type { StaticService } from "./staticService";

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

	private start() {
		if (this.state === SniperState.START) {
			this.loggerService.addLog("Sniper is already started!", "warning");
			return;
		}

		this.state = SniperState.START;

		this.updateButtonStates();

		const coins = this.userService.getUserCoins().toLocaleString();
		const searchBucket = this.filterService.getSearchBucket();
		const searchCriterias = this.filterService.getSearchCriterias();
		const settings = this.settingsService.getSettings();

		this.loggerService.addLog(
			`Sniper started! Coins: ${coins}, Using ${searchCriterias.length} criteria`,
			"info",
		);

		this.searchCounter = 0;
		this.cycleCount = 0;
		this.consecutiveFailures = 0;
		this.seenTradeIds.clear();

		this.performSearch(searchBucket, searchCriterias, settings);
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

	private generateSingleValues(limit: number, startValue: number): number[] {
		const values = [0];

		for (let i = startValue; i <= limit; i += (i >= 1000 ? 1000 : 50)) {
			values.push(i);
		}

		return values;
	}

	private generateBothCombinations(bidLimit: number, buyLimit: number): Array<{ minBid: number, minBuy: number }> {
		const combinations: Array<{ minBid: number, minBuy: number }> = [];
		const bidValues = this.generateSingleValues(bidLimit, 150);
		const buyValues = this.generateSingleValues(buyLimit, 200);

		for (const bid of bidValues) {
			for (const buy of buyValues) {
				combinations.push({ minBid: bid, minBuy: buy });
			}
		}

		return combinations;
	}

	private applyCachePrevention(
		settings: Settings,
		searchCriteria: SearchCriteria,
	) {
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
			this.audioService.error();
		} else if (response.status === 512 || response.status === 503) {
			shouldStopBot = true;
			this.loggerService.addLog(
				"Server maintenance detected - stopping sniper",
				"error",
			);
			this.audioService.error();
		} else {
			this.consecutiveFailures++;

			if (this.consecutiveFailures >= 3) {
				shouldStopBot = true;
				this.loggerService.addLog(
					`Search failed ${this.consecutiveFailures} times consecutively - auto-stopping`,
					"error",
				);
				this.audioService.error();
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

	private sendPinEvents(pageId: string) {
		services.PIN.sendData(PINEventType.PAGE_VIEW, {
			type: PIN_PAGEVIEW_EVT_TYPE,
			pgid: pageId,
		});
	}

	private buyItem(
		item: any,
		price: number,
		settings: Settings,
	) {
		const tradeId = item._auction.tradeId;

		if (settings.search.enableDryBuy) {
			this.loggerService.addLog(
				`${tradeId}: ${price} | dry buy, not actually buying`,
				"success",
			);
			this.audioService.success();
			return;
		}

		services.Item.bid(item, price).observe(this, (_, data) => {
			if (!data.success) {
				this.loggerService.addLog(`${tradeId}: ${price} | buy failed`, "error");
				this.audioService.fail();
				this.staticService.increment("Fails");
				return;
			}

			this.loggerService.addLog(`${tradeId}:  ${price} | bought`, "success");
			this.audioService.success();
			this.staticService.increment("Wins");
		});
	}

	private processSearchResults(
		items: any[],
		settings: Settings,
	) {
		this.sendPinEvents("Transfer Market Results - List View");

		if (items.length > 5) {
			this.loggerService.addLog(
				`SAFEGUARD: Too many results (${items.length}) - STOPPING to prevent mass buying!`,
				"error",
			);
			this.audioService.error();
			this.stop();
			return;
		}

		if (items.length > 0) {
			this.sendPinEvents("Transfer Market Results - List View");
		}

		for (const item of items) {
			const auction = item._auction;
			const buyNowPrice = auction.buyNowPrice;
			const tradeId = auction.tradeId;

			if (this.seenTradeIds.has(tradeId)) {
				continue;
			}

			this.seenTradeIds.add(tradeId);

			this.buyItem(
				item,
				buyNowPrice,
				settings
			);
		}
	}

	private handleSearchResponse(
		response: any,
		searchBucket: SearchBucket,
		searchCriterias: SearchCriteria[],
		settings: Settings,
	) {
		if (this.state === SniperState.STOP) {
			return;
		}

		if (!response.success && this.handleSearchError(response)) {
			return;
		}

		this.processSearchResults(response.data.items, settings);
		this.sendPinEvents("Transfer Market Search");

		this.staticService.increment("Searches");
		this.consecutiveFailures = 0;
		this.searchCounter += 1;
		this.cycleCount += 1;

		const enabledCycles = settings.safety.enabledCycles;

		const cyclesCount = Math.floor(
			Math.random()
			* (settings.safety.cyclesCount.max - settings.safety.cyclesCount.min + 1)
			+ settings.safety.cyclesCount.min,
		);

		if (enabledCycles && this.cycleCount >= cyclesCount) {
			const { min, max } = settings.safety.delayBetweenCycles;

			const delayBetweenCycles = Math.floor(
				Math.random()
				* (max - min + 1)
				+ min,
			) * 1000;

			this.loggerService.addLog(
				`Cycle limit reached - pausing for ${(
					delayBetweenCycles / 1000
				).toLocaleString()}s`,
				"info",
			);

			this.cycleCount = 0;

			this.interval = setTimeout(() => {
				const coins = this.userService.getUserCoins().toLocaleString();

				this.loggerService.addLog(
					`Resuming sniper! Coins: ${coins}, Using ${searchCriterias.length} criteria`,
					"info",
				);

				this.performSearch(searchBucket, searchCriterias, settings);
			}, delayBetweenCycles);
		} else {
			const delayBetweenSearches = Math.floor(
				Math.random()
				* (settings.safety.delayBetweenSearches.max - settings.safety.delayBetweenSearches.min + 1)
				+ settings.safety.delayBetweenSearches.min,
			) * 1000;

			this.interval = setTimeout(() => {
				this.performSearch(searchBucket, searchCriterias, settings);
			}, delayBetweenSearches);
		}
	}

	private performSearch(
		searchBucket: SearchBucket,
		searchCriterias: SearchCriteria[],
		settings: Settings,
	) {
		if (this.state === SniperState.STOP) {
			return;
		}

		const searchCriteria =
			searchCriterias[this.searchCounter % searchCriterias.length];

		const utSearchCriteria = new UTSearchCriteriaDTO();
		Object.assign(utSearchCriteria, searchCriteria);

		const searchModel = new UTBucketedItemSearchViewModel();
		searchModel.searchBucket = searchBucket;
		searchModel.searchFeature = "market";
		searchModel.updateSearchCriteria(utSearchCriteria);

		this.applyCachePrevention(settings, searchModel.searchCriteria);

		services.Item.clearTransferMarketCache();

		services.Item.searchTransferMarket(
			searchModel.searchCriteria,
			1,
		).observe(this, (_, response) =>
			this.handleSearchResponse(
				response,
				searchBucket,
				searchCriterias,
				settings,
			)
		);
	}

	private createButtonContainer() {
		this.buttonContainer = document.createElement("div");
		this.buttonContainer.classList.add("button-container");
		this.buttonContainer.style.borderRadius = "16px";

		this.stopButton = createButton({
			value: "Stop",
			size: "mini",
			variant: "danger",
			onclick: () => this.stop(),
		});

		this.startButton = createButton({
			value: "Start",
			size: "mini",
			variant: "primary",
			onclick: () => this.start(),
		});

		this.settingsButton = createButton({
			value: "Settings",
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
		private userService: UserService,
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

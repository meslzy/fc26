import type { AudioService } from "~/core/audio/sounds";
import type { FilterManager } from "~/core/filters/filter-manager";
import type { SniperSettings } from "~/types";
import type { Logger } from "~/utils/logger";

export class SniperEngine {
	private settings: SniperSettings;
	private audioService: AudioService;
	private filterManager: FilterManager;
	private logger: Logger;

	private searchTimeoutId: NodeJS.Timeout | null = null;
	private isSearchInProgress = false;
	private currentCycleCount = 0;
	private consecutiveFailures = 0;
	private seenTradeIds = new Set<number>();

	private static readonly MAX_CONSECUTIVE_FAILURES = 3;
	private static readonly MAX_RESULTS_SAFEGUARD = 5;

	constructor(
		settings: SniperSettings,
		audioService: AudioService,
		filterManager: FilterManager,
		logger: Logger,
	) {
		this.settings = settings;
		this.audioService = audioService;
		this.filterManager = filterManager;
		this.logger = logger;
	}

	updateSettings(newSettings: SniperSettings) {
		this.settings = newSettings;
		this.audioService.setEnabled(newSettings.isSoundEnabled);
	}

	isRunning(): boolean {
		return this.isSearchInProgress;
	}

	start(): boolean {
		if (this.isSearchInProgress) {
			this.logger.addLog("Search already in progress", "error");
			return false;
		}

		this.isSearchInProgress = true;
		this.currentCycleCount = 0;
		this.filterManager.resetFilterIndex();

		const selectedFilters = this.filterManager.getSelectedFilters();

		if (selectedFilters.length > 0) {
			this.logger.addLog(`Search started with ${selectedFilters.length} selected filters`);
		} else {
			this.logger.addLog("Search started with current filter criteria");
		}

		this.performSearch();

		return true;
	}

	stop(): boolean {
		if (!this.isSearchInProgress) {
			this.logger.addLog("No search in progress", "error");
			return false;
		}

		this.isSearchInProgress = false;

		if (this.searchTimeoutId) {
			clearTimeout(this.searchTimeoutId);
			this.searchTimeoutId = null;
		}

		this.seenTradeIds.clear();

		this.logger.addLog("Search stopped");

		return true;
	}

	private performSearch() {
		if (!this.isSearchInProgress) {
			return;
		}

		this.loadNextFilterForSearch();

		const searchCriteria = this.getSearchCriteria();

		if (!searchCriteria) {
			this.logger.addLog("Failed to get search criteria", "error");
			this.stop();
			return;
		}

		services.Item.clearTransferMarketCache();

		searchCriteria.minBid = 0;
		searchCriteria.maxBid =
			Math.round((Math.random() * (800000 - 300000) + 300000) / 1000) * 1000;

		services.Item.searchTransferMarket(searchCriteria, 1).observe(
			this,
			(_, response) => this.handleSearchResponse(response),
		);
	}

	private loadNextFilterForSearch() {
		const selectedFilters = this.filterManager.getSelectedFilters();

		if (selectedFilters.length === 0) {
			return;
		}

		const filter = this.filterManager.getCurrentFilter();
		if (!filter) return;

		try {
			const controller = getAppMain()
				.getRootViewController()
				.getPresentedViewController()
				.getCurrentViewController()
				.getCurrentController();

			if (filter.playerData) {
				controller.viewmodel.playerData = filter.playerData;
			}

			Object.assign(controller.viewmodel.searchCriteria, filter.searchCriteria);

			controller.viewmodel.searchCriteria.maxBid = 0;
			controller.viewmodel.searchCriteria.minBid = 0;

			controller.viewDidAppear();
		} catch {
			this.logger.addLog("Failed to load filter for search", "error");
		}

		this.filterManager.moveToNextFilter();
	}

	private getSearchCriteria() {
		try {
			return getAppMain()
				.getRootViewController()
				.getPresentedViewController()
				.getCurrentViewController()
				.getCurrentController().viewmodel.searchCriteria;
		} catch {
			return null;
		}
	}

	private handleSearchResponse(response: any) {
		if (!this.isSearchInProgress) {
			this.logger.addLog("Search stopped");
			return;
		}

		if (!response.success) {
			const stopped = this.handleSearchError(response);
			if (stopped) return;
		} else {
			this.consecutiveFailures = 0;
			this.processSearchResults(response.data.items);
		}

		this.sendPinEvents("Transfer Market Search");
		this.scheduleNextSearch();
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
			this.logger.addLog("🤖 CAPTCHA detected - stopping sniper", "error");
			this.audioService.error();
		} else if (response.status === 512 || response.status === 503) {
			shouldStopBot = true;
			this.logger.addLog(
				"Server maintenance detected - stopping sniper",
				"error",
			);
			this.audioService.error();
		} else {
			this.consecutiveFailures++;

			if (this.consecutiveFailures >= SniperEngine.MAX_CONSECUTIVE_FAILURES) {
				shouldStopBot = true;
				this.logger.addLog(
					`Search failed ${this.consecutiveFailures} times consecutively - auto-stopping`,
					"error",
				);
				this.audioService.error();
			} else {
				this.logger.addLog(
					`Search failed (${this.consecutiveFailures}/${SniperEngine.MAX_CONSECUTIVE_FAILURES}) - Status: ${response.status}`,
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

	private processSearchResults(items: any[]) {
		if (items.length > SniperEngine.MAX_RESULTS_SAFEGUARD) {
			this.logger.addLog(
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

			this.buyItem(item, buyNowPrice);
		}
	}

	private buyItem(item: any, price: number) {
		const tradeId = item._auction.tradeId;

		const itemName = `${item._staticData.firstName} ${item._staticData.lastName}`;

		if (this.settings.isDryRun) {
			this.logger.addLog(
				`${itemName} [${tradeId}] ${price} [DRY RUN] simulated buy`,
				"system",
			);
			this.audioService.success();
			return;
		}

		services.Item.bid(item, price).observe(this, (_, data) => {
			if (!data.success) {
				this.logger.addLog(
					`${itemName} [${tradeId}] ${price} buy failed`,
					"error",
				);
				this.audioService.fail();
				return;
			}

			this.logger.addLog(`${itemName} [${tradeId}] ${price} bought`, "success");
			this.audioService.success();
		});
	}

	private scheduleNextSearch() {
		this.currentCycleCount++;

		if (this.currentCycleCount >= this.settings.cycleCount) {
			this.currentCycleCount = 0;
			const randomDelay =
				this.settings.cyclePause[
				Math.floor(Math.random() * this.settings.cyclePause.length)
				];
			this.logger.addLog(
				`Cycle complete (${this.settings.cycleCount} searches) - pausing for ${randomDelay}ms`,
				"system",
			);
			this.searchTimeoutId = setTimeout(
				() => this.performSearch(),
				randomDelay,
			);
		} else {
			const randomDelay =
				this.settings.searchDelays[
				Math.floor(Math.random() * this.settings.searchDelays.length)
				];
			this.searchTimeoutId = setTimeout(
				() => this.performSearch(),
				randomDelay,
			);
		}
	}

	private sendPinEvents(pageId: string) {
		try {
			services.PIN.sendData(PINEventType.PAGE_VIEW, {
				type: PIN_PAGEVIEW_EVT_TYPE,
				pgid: pageId,
			});
		} catch {
			this.logger.addLog("Failed to send PIN event", "error");
		}
	}
}

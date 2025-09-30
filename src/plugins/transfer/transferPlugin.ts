import { AudioService } from "~/services/audioService";
import { LoggerService } from "~/services/loggerService";
import { StaticService } from "~/services/staticService";
import { FilterManager } from "./managers/filterManager";
import { SettingsManager } from "./managers/settingsManager";
import { FilterService } from "./services/filterService";
import { FinderService } from "./services/finderService";
import { ProfitService } from "./services/profitService";
import { SettingsService } from "./services/settingsServices";
import { SniperService } from "./services/sniperService";

export class TransferPlugin {
	audioService: AudioService;
	loggerService: LoggerService;
	staticService: StaticService;

	filterManager: FilterManager;
	settingsManager: SettingsManager;

	filterService: FilterService;
	finderService: FinderService;
	profitService: ProfitService;
	settingsService: SettingsService;
	sniperService: SniperService;

	defaultStatic: Record<string, string> = {
		Searches: "0",
		Wins: "0",
		Fails: "0",
	};

	constructor() {
		this.audioService = new AudioService();
		this.loggerService = new LoggerService();
		this.staticService = new StaticService(this.defaultStatic);

		this.filterManager = new FilterManager();
		this.settingsManager = new SettingsManager();

		this.filterService = new FilterService(this.filterManager);
		this.finderService = new FinderService(this.loggerService);
		this.profitService = new ProfitService();
		this.settingsService = new SettingsService(this.settingsManager);
		this.sniperService = new SniperService(
			this.audioService,
			this.filterService,
			this.staticService,
			this.loggerService,
			this.settingsService,
		);
	}

	init() {
		const that = this;

		const UTBucketedItemSearchViewModel_setSearchBucket = UTBucketedItemSearchViewModel.prototype.setSearchBucket;

		UTBucketedItemSearchViewModel.prototype.setSearchBucket = function (searchBucket: SearchBucket) {
			UTBucketedItemSearchViewModel_setSearchBucket.call(this, searchBucket);
			that.filterService.onSearchBucket(searchBucket);
		};

		UTMarketSearchFiltersView.Event = Object.freeze({
			...UTMarketSearchFiltersView.Event,
			SELL_PRICE_CHANGE: "UTMarketSearchFiltersView.Event.SELL_PRICE_CHANGE",
		});

		UTMarketSearchFiltersView.prototype.setSellPrice = function (value) {
			this._sellPrice.value = value;
		};

		UTMarketSearchFiltersView.prototype.eSellPriceChanged = function () {
			const value = this._sellPrice.value;

			if (value < 0) this._sellPrice.value = 0;

			this._triggerActions(UTMarketSearchFiltersView.Event.SELL_PRICE_CHANGE, {
				value: this._sellPrice.value,
			});
		};

		UTMarketSearchFiltersViewController.prototype.eSellPriceChanged = function (_a, _e, f) {
			if (this.viewmodel) {
				this.viewmodel.searchCriteria.sellPrice = f.value;
			}
		};

		const UTMarketSearchFiltersViewController_viewDidAppear =
			UTMarketSearchFiltersViewController.prototype.viewDidAppear;

		UTMarketSearchFiltersViewController.prototype.viewDidAppear = function () {
			UTMarketSearchFiltersViewController_viewDidAppear.call(this);

			const view = this.getView();

			view.addTarget(this, this.eSellPriceChanged, UTMarketSearchFiltersView.Event.SELL_PRICE_CHANGE);

			view.setSellPrice(this.viewmodel.searchCriteria?.sellPrice || 0);
		};

		const UTMarketSearchFiltersViewController_viewWillDisappear =
			UTMarketSearchFiltersViewController.prototype.viewWillDisappear;
		UTMarketSearchFiltersViewController.prototype.viewWillDisappear = function () {
			const view = this.getView();

			view.removeTarget(this, this.eSellPriceChanged, UTMarketSearchFiltersView.Event.SELL_PRICE_CHANGE);

			UTMarketSearchFiltersViewController_viewWillDisappear.call(this);
		};

		const UTMarketSearchFiltersView_resetPrices = UTMarketSearchFiltersView.prototype.resetPrices;

		UTMarketSearchFiltersView.prototype.resetPrices = function () {
			UTMarketSearchFiltersView_resetPrices.call(this);
			this._sellPrice.reset();
		};

		const UTMarketSearchFiltersView_generate = UTMarketSearchFiltersView.prototype._generate;

		UTMarketSearchFiltersView.prototype._generate = function () {
			UTMarketSearchFiltersView_generate.call(this);

			this._sellPrice = new UTSearchCriteriaPriceView();
			this._sellPrice.init();
			this._sellPrice.label = "";
			this._sellPrice.__root.style.flex = "1";

			if (getCurrentView() instanceof UTSplitView) {
				return;
			}

			const sellPriceInput = this._sellPrice.getCurrencyInput();
			sellPriceInput.addTarget(this, this.eSellPriceChanged, EventType.CHANGE);

			const searchPrices = this.__searchContainer.querySelector(".search-prices");

			const profitCriteriaContainer = document.createElement("div");
			profitCriteriaContainer.classList.add("ut-market-search-filters-view--criteria-container");
			profitCriteriaContainer.style.justifyContent = "center";
			profitCriteriaContainer.style.paddingTop = "24px";
			that.profitService.init(profitCriteriaContainer);
			searchPrices.appendChild(profitCriteriaContainer);

			const sellPriceHeader = document.createElement("div");
			sellPriceHeader.classList.add("search-price-header");

			const sellPriceTitle = document.createElement("h1");
			sellPriceTitle.textContent = "Sell Price";
			sellPriceHeader.appendChild(sellPriceTitle);

			const sellPriceCriteriaContainer = document.createElement("div");
			sellPriceCriteriaContainer.classList.add("ut-market-search-filters-view--criteria-container");
			sellPriceCriteriaContainer.appendChild(this._sellPrice.getRootElement());

			searchPrices.appendChild(sellPriceHeader);
			searchPrices.appendChild(sellPriceCriteriaContainer);

			const pinnedListContainer = this.__root.querySelector(".ut-pinned-list-container");

			pinnedListContainer.style.display = "flex";
			pinnedListContainer.style.flexDirection = "row";
			pinnedListContainer.style.gap = "15px";

			this.__searchContainer.style.flex = "1";
			this.__searchContainer.style.maxWidth = "none";
			this.__searchContainer.style.maxHeight = "90%";
			this.__searchContainer.style.position = "relative";

			that.filterService.init(this.__searchContainer);
			that.finderService.init(this.__searchContainer);

			const seachContainer = this.__searchContainer.parentElement as HTMLElement;

			const panel = document.createElement("div");
			panel.classList.add("ut-content");
			panel.style.flex = "1";
			panel.style.maxWidth = "none";
			panel.style.maxHeight = "90%";
			panel.style.display = "flex";
			panel.style.flexDirection = "column";
			panel.style.gap = "15px";
			panel.style.position = "relative";

			that.staticService.init(panel);
			that.loggerService.init(panel);
			that.settingsService.init(panel);
			that.sniperService.init(panel);

			seachContainer.appendChild(panel);
		};
	}
}

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
	private counter = 1;

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

		this.counter = 1;

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

	private generateSingleValues(limit: number): number[] {
		const values = [0];

		for (let i = 150; i <= limit; i += (i >= 1000 ? 1000 : 50)) {
			values.push(i);
		}

		return values;
	}

	private generateBothCombinations(bidLimit: number, buyLimit: number): Array<{ minBid: number, minBuy: number }> {
		const combinations: Array<{ minBid: number, minBuy: number }> = [];
		const bidValues = this.generateSingleValues(bidLimit);
		const buyValues = this.generateSingleValues(buyLimit);

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

		const bidLimit = settings.search.randomMinBid.amount;
		const buyLimit = settings.search.randomMinBuy.amount;

		if (!bidEnabled && !buyEnabled) {
			const combinations = this.generateBothCombinations(bidLimit, buyLimit);
			const combination = combinations[this.counter % combinations.length];
			searchCriteria.minBid = combination.minBid;
			searchCriteria.minBuy = combination.minBuy;
		} else if (bidEnabled && buyEnabled) {
			const combinations = this.generateBothCombinations(bidLimit, buyLimit);
			const combination = combinations[this.counter % combinations.length];
			searchCriteria.minBid = combination.minBid;
			searchCriteria.minBuy = combination.minBuy;
		} else if (bidEnabled) {
			const values = this.generateSingleValues(bidLimit);
			searchCriteria.minBid = values[this.counter % values.length];
			searchCriteria.minBuy = 0;
		} else if (buyEnabled) {
			const values = this.generateSingleValues(buyLimit);
			searchCriteria.minBid = 0;
			searchCriteria.minBuy = values[this.counter % values.length];
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

		this.staticService.increment("Searches");

		const searchCriteria =
			searchCriterias[this.counter % searchCriterias.length];

		const utSearchCriteria = new UTSearchCriteriaDTO();
		Object.assign(utSearchCriteria, searchCriteria);

		const searchModel = new UTBucketedItemSearchViewModel();
		searchModel.searchBucket = searchBucket;
		searchModel.searchFeature = "market";
		searchModel.updateSearchCriteria(utSearchCriteria);
		this.applyCachePrevention(settings, searchModel.searchCriteria);

		// services.Item.clearTransferMarketCache();

		this.loggerService.addLog(`minBid: ${searchModel.searchCriteria.minBid}, minBuy: ${searchModel.searchCriteria.minBuy}`, "info");

		this.staticService.increment("Searches");

		this.counter += 1;
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

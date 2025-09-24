import type { PlasmoCSConfig } from "plasmo";
import type { SearchBucket } from "~/core/bucket";
import { FilterManager } from "~/managers/filterManager";
import { SearchManager } from "~/managers/searchManager";
import { SettingsManager } from "~/managers/settingsManager";
import { StorageManager } from "~/managers/storageManager";
import { AudioService } from "~/services/audioService";
import { FilterService } from "~/services/filterService";
import { LoggerService } from "~/services/loggerService";
import { SettingsService } from "~/services/settingsServices";
import { SniperService } from "~/services/sniperService";
import { StaticService } from "~/services/staticService";
import { UserService } from "~/services/userService";

export const config: PlasmoCSConfig = {
	all_frames: false,
	matches: ["https://*.ea.com/*"],
	run_at: "document_end",
	world: "MAIN",
};

const storageManager = new StorageManager();
const searchManager = new SearchManager();
const settingsManager = new SettingsManager(storageManager);
const filterManager = new FilterManager(storageManager, searchManager);

const filterService = new FilterService(filterManager);
const staticService = new StaticService();
const loggerService = new LoggerService();
const settingsService = new SettingsService(settingsManager);

const audioService = new AudioService();
const userService = new UserService();

const sniperService = new SniperService(
	audioService,
	userService,
	filterService,
	staticService,
	loggerService,
	settingsService,
);

const UTBucketedItemSearchViewModel__setSearchBucket =
	UTBucketedItemSearchViewModel.prototype.setSearchBucket;

UTBucketedItemSearchViewModel.prototype.setSearchBucket =
	function setSearchBucket(searchBucket: SearchBucket) {
		UTBucketedItemSearchViewModel__setSearchBucket.call(this, searchBucket);
		filterService.onSearchBucket(searchBucket);
	};

const UTMarketSearchFiltersView__generate =
	UTMarketSearchFiltersView.prototype._generate;

UTMarketSearchFiltersView.prototype._generate = function _generate() {
	UTMarketSearchFiltersView__generate.call(this);

	const pinnedListContainer = this.__root.querySelector(
		".ut-pinned-list-container",
	) as HTMLElement;
	pinnedListContainer.style.display = "flex";
	pinnedListContainer.style.flexDirection = "row";
	pinnedListContainer.style.gap = "10px";

	this.__searchContainer.style.flex = "1";
	this.__searchContainer.style.maxWidth = "none";
	this.__searchContainer.style.maxHeight = "90%";
	this.__searchContainer.style.position = "relative";

	filterService.init(this.__searchContainer);

	const seachContainer = this.__searchContainer.parentElement as HTMLElement;

	const panel = document.createElement("div");
	panel.classList.add("ut-content");
	panel.style.flex = "1";
	panel.style.maxWidth = "none";
	panel.style.maxHeight = "90%";
	panel.style.display = "flex";
	panel.style.flexDirection = "column";
	panel.style.gap = "10px";
	panel.style.position = "relative";

	staticService.init(panel);
	loggerService.init(panel);
	sniperService.init(panel);
	settingsService.init(panel);

	seachContainer.appendChild(panel);
};

import type { PlasmoCSConfig } from "plasmo";
import { FilterService } from "~/services/filterService";
import { LoggerService } from "~/services/loggerService";
import { SettingsService } from "~/services/settings.services";
import { SniperService } from "~/services/sniperService";
import { StaticService } from "~/services/staticService";
import type { SearchBucket } from "~/types/fc";

export const config: PlasmoCSConfig = {
	all_frames: false,
	matches: ["https://*.ea.com/*"],
	run_at: "document_end",
	world: "MAIN",
};

const filterService = new FilterService();
const staticService = new StaticService();
const loggerService = new LoggerService();
const sniperService = new SniperService();
const settingsService = new SettingsService(loggerService);

sniperService.onSettingsClick = () => {
	settingsService.showSettings();
};

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

	const pinnedListContainer = this.__root.querySelector(".ut-pinned-list-container") as HTMLElement;
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

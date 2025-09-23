import type { PlasmoCSConfig } from "plasmo";
import { FilterService } from "~/services/filterService";
import { PanelService } from "~/services/panelService";
import type { SearchBucket } from "~/types/fc";

export const config: PlasmoCSConfig = {
	all_frames: false,
	matches: ["https://*.ea.com/*"],
	run_at: "document_end",
	world: "MAIN",
};

const panelService = new PanelService();
const filterService = new FilterService();

const UTBucketedItemSearchViewModel__setSearchBucket =
	UTBucketedItemSearchViewModel.prototype.setSearchBucket;

UTBucketedItemSearchViewModel.prototype.setSearchBucket =
	function setSearchBucket(bucket: SearchBucket) {
		UTBucketedItemSearchViewModel__setSearchBucket.call(this, bucket);
		filterService.onSearchBucket(bucket);
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
	panelService.init(this.__searchContainer.parentElement);
};

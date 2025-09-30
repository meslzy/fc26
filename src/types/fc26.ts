declare global {
	const EventType: any;
	const getAppMain: any;
	const JSUtils: any;
	const PINEventType: any;
	const PIN_PAGEVIEW_EVT_TYPE: any;
	const services: any;
	const UTBucketedItemSearchViewModel: any;
	const UTGameFlowNavigationController: any;
	const UTGameTabBarController: any;
	const UTLocalizationUtil: any;
	const UTMarketSearchFiltersView: any;
	const UTMarketSearchFiltersViewController: any;
	const UTPlayerItemView: any;
	const UTRootView: any;
	const UTRootViewController: any;
	const UTSearchCriteriaDTO: any;
	const UTSearchCriteriaPriceView: any;
	const UTSplitView: any;
	const UTTabBarItemView: any;
	const repositories: any;
	const ItemPile: any;

	export interface SearchCriteria {
		academyOnly: boolean;
		_authenticity: string;
		_category: string;
		_position: string;
		_sort: string;
		_subtypes: number[];
		_type: string;
		_untradeables: string;
		_zone: number;
		academySlotId: number;
		club: number;
		count: number;
		defId: number[];
		evolutionStatus: string;
		excludeDefIds: number[];
		excludeLimitedUse: boolean;
		isExactSearch: boolean;
		excludeTimeEvo: boolean;
		league: number;
		level: string;
		maskedDefId: number;
		maxBid: number;
		maxBuy: number;
		minBid: number;
		minBuy: number;
		sellPrice: number;
		nation: number;
		offset: number;
		playStyle: number;
		preferredPositionOnly: boolean;
		primaryColor: number;
		rarities: number[];
		secondaryColor: number;
		sortBy: string;
		icontraits: string;
		ovrMin: number;
		ovrMax: number;
	}

	export interface PlayerData {
		id: number;
		firstName: string;
		lastName: string;
		commonName: string;
		rating: number;
	}

	export enum SearchBucket {
		PLAYER = 0,
		STAFF = 1,
		CLUB = 2,
		CONSUMABLE = 3,
	}
}

export {};

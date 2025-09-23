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

export class SearchManager {
	getDefaultSearchCriteria(): SearchCriteria {
		const defaultSearchCriteria = getAppMain()
			.getRootViewController()
			.currentController.getCurrentViewController()
			.getCurrentController().viewmodel.defaultSearchCriteria;

		return { ...defaultSearchCriteria };
	}

	getSearchCriteria(): SearchCriteria {
		const searchCriteria = getAppMain()
			.getRootViewController()
			.currentController.getCurrentViewController()
			.getCurrentController().viewmodel.searchCriteria;

		return { ...searchCriteria };
	}

	getSearchPlayerData(): PlayerData | null {
		const playerData = getAppMain()
			.getRootViewController()
			.currentController.getCurrentViewController()
			.getCurrentController().viewmodel.playerData;

		return playerData ? { ...playerData } : null;
	}

	setSearch(searchCriteria: Partial<SearchCriteria>, playerData: PlayerData | null) {
		const controller = getAppMain()
			.getRootViewController()
			.currentController.getCurrentViewController()
			.getCurrentController();

		Object.assign(
			controller.viewmodel.searchCriteria,
			searchCriteria,
		);

		if (playerData) {
			controller.viewmodel.playerData = playerData;
		}

		controller.viewDidAppear();
	}
}

export const getCurrentController = () => {
	return getAppMain()
		.getRootViewController()
		.getPresentedViewController()
		.getCurrentViewController()
		.getCurrentController();
};

export const getCurrentLeftController = () => {
	return getAppMain()
		.getRootViewController()
		.getPresentedViewController()
		.getCurrentViewController()
		.getCurrentController().leftController;
};

export const getCurrentRightController = () => {
	return getAppMain()
		.getRootViewController()
		.getPresentedViewController()
		.getCurrentViewController()
		.getCurrentController().rightController;
};

export const getCurrentView = () => {
	return getAppMain().getRootViewController().getPresentedViewController().getCurrentViewController().getCurrentView();
};

export const getDefaultSearchCriteria = (): SearchCriteria => {
	const defaultSearchCriteria = getAppMain()
		.getRootViewController()
		.currentController.getCurrentViewController()
		.getCurrentController().viewmodel.defaultSearchCriteria;

	return { ...defaultSearchCriteria };
};

export const getSearchCriteria = (): SearchCriteria => {
	const searchCriteria = getAppMain()
		.getRootViewController()
		.currentController.getCurrentViewController()
		.getCurrentController().viewmodel.searchCriteria;

	return { ...searchCriteria };
};

export const getSearchPlayerData = (): PlayerData | null => {
	const playerData = getAppMain()
		.getRootViewController()
		.currentController.getCurrentViewController()
		.getCurrentController().viewmodel.playerData;

	return playerData ? { ...playerData } : null;
};

export const setSearch = (searchCriteria: Partial<SearchCriteria>, playerData: PlayerData | null) => {
	const controller = getAppMain()
		.getRootViewController()
		.currentController.getCurrentViewController()
		.getCurrentController();

	Object.assign(controller.viewmodel.searchCriteria, searchCriteria);

	if (playerData) {
		controller.viewmodel.playerData = playerData;
	}

	controller.viewDidAppear();
};

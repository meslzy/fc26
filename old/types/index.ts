export interface SniperSettings {
	isDryRun: boolean;
	isSoundEnabled: boolean;
	searchDelays: number[];
	cycleCount: number;
	cyclePause: number[];
}

export interface FilterData {
	id: string;
	playerData: any;
	searchCriteria: any;
	timestamp: number;
	description: string;
}

export type LogType = "info" | "success" | "error" | "system";

export type ButtonVariant = "default" | "success" | "danger";

export interface ButtonConfig {
	text: string;
	onClick: () => void;
	variant?: ButtonVariant;
}

declare global {
	const getAppMain: any;
	const UTNavigationContainerView: any;
	const UTMarketSearchFiltersView: any;
	const services: any;
	const PINEventType: any;
	const PIN_PAGEVIEW_EVT_TYPE: any;
}

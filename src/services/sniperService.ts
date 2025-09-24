import { createButton } from "~/components/button";
import type { AudioService } from "~/services/audioService";
import type { UserService } from "~/services/userService";
import type { FilterService } from "./filterService";
import type { LoggerService } from "./loggerService";
import type { SettingsService } from "./settings.services";
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

	private createButtonContainer() {
		this.buttonContainer = document.createElement("div");
		this.buttonContainer.classList.add("button-container");
		this.buttonContainer.style.borderRadius = "16px";

		this.stopButton = createButton({
			value: "Stop",
			size: "mini",
			variant: "danger",
			onclick: () => {},
		});

		this.startButton = createButton({
			value: "Start",
			size: "mini",
			variant: "primary",
			onclick: () => {},
		});

		this.settingsButton = createButton({
			value: "Settings",
			size: "mini",
			style: {
				flex: "none",
			},
			onclick: () => {
				this.settingsService.showSettings();
			},
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
	};
}

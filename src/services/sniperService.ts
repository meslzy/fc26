import { createButton } from "~/components/button";
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

	private updateButtonStates() {
		if (this.state === SniperState.START) {
			this.startButton.disabled = true;
			this.startButton.classList.add('disabled');
			this.stopButton.disabled = false;
			this.stopButton.classList.remove('disabled');
		} else {
			this.startButton.disabled = false;
			this.startButton.classList.remove('disabled');
			this.stopButton.disabled = true;
			this.stopButton.classList.add('disabled');
		}
	}

	private start() {
		if (this.state === SniperState.START) {
			this.loggerService.addLog("Sniper is already started!", "warning");
			return;
		}

		this.staticService.set("Searches", "0");

		this.state = SniperState.START;

		this.updateButtonStates();

		const coins = this.userService.getUserCoins().toLocaleString();
		const searchBucket = this.filterService.getSearchBucket();

		this.loggerService.addLog(`Current Coins: ${coins}`, "info");
		this.loggerService.addLog(`Using ${searchBucket} search bucket`, "info");

		this.interval = setInterval(() => {
			this.staticService.increment("Searches");
		}, 1000);
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

import type { PlasmoCSConfig } from "plasmo";
import { ButtonFactory } from "~/components/buttons/button-factory";
import { FilterModalManager } from "~/components/modals/filter-modal";
import { SettingsPanel } from "~/components/ui/settings-panel";
import { AudioService } from "~/core/audio/sounds";
import { FilterManager } from "~/core/filters/filter-manager";
import { SniperEngine } from "~/core/sniper/sniper-engine";
import { StorageService } from "~/services/storage";
import type { SniperSettings } from "~/types";
import { insertAfter, select } from "~/utils/dom";
import { Logger } from "~/utils/logger";

export const config: PlasmoCSConfig = {
	all_frames: false,
	matches: ["https://*.ea.com/*"],
	run_at: "document_end",
	world: "MAIN",
};

const logger = new Logger();
const audioService = new AudioService();
const filterManager = new FilterManager(logger);
const filterModalManager = new FilterModalManager(filterManager);

const defaultSettings: SniperSettings = {
	isDryRun: false,
	isSoundEnabled: true,
	searchDelays: [1000, 2000, 3000],
	cycleCount: 20,
	cyclePause: [10000, 15000, 20000],
};

let settings = StorageService.loadSettings(defaultSettings);
audioService.setEnabled(settings.isSoundEnabled);

const settingsPanel = new SettingsPanel(settings, (newSettings) => {
	settings = newSettings;
	audioService.setEnabled(newSettings.isSoundEnabled);
	sniperEngine.updateSettings(newSettings);
	StorageService.saveSettings(newSettings);
});

const sniperEngine = new SniperEngine(
	settings,
	audioService,
	filterManager,
	logger,
);

const saveCurrentSearch = function (this: any) {
	const controller = getAppMain()
		.getRootViewController()
		.getPresentedViewController()
		.getCurrentViewController()
		.getCurrentController();

	const searchCriteria = controller.viewmodel.searchCriteria;
	const itemData = controller.viewmodel.playerData;

	filterManager.saveFilter(itemData, searchCriteria);
	updateFilterButtons.call(this);
};

const createFilterModal = function (this: any) {
	filterModalManager.createFilterModal(this);
};

const updateFilterButtons = function (this: any) {
	if (this._manageButton) {
		if (filterManager.getFilterCount() === 0) {
			this._manageButton.textContent = "🖊️";
			this._manageButton.style.opacity = "0.5";
		} else {
			const selectedCount = filterManager.getSelectedCount();
			if (selectedCount > 0) {
				this._manageButton.textContent = `🖊️ ${selectedCount}/${filterManager.getFilterCount()}`;
				this._manageButton.style.opacity = "1";
				this._manageButton.style.color = "#00ff88";
			} else {
				this._manageButton.textContent = `🖊️ ${filterManager.getFilterCount()}`;
				this._manageButton.style.opacity = "1";
				this._manageButton.style.color = "white";
			}
		}
	}

	if (this._addButton) {
		if (filterManager.isEditing()) {
			this._addButton.textContent = "💾";
			this._addButton.style.background = "#ff6600";
		} else {
			this._addButton.textContent = "➕";
			this._addButton.style.background = "#333";
		}
	}

	if (this._cancelButton) {
		if (filterManager.isEditing()) {
			this._cancelButton.style.display = "block";
		} else {
			this._cancelButton.style.display = "none";
		}
	}
};

const start = function (this: any) {
	if (!this.createdLogs) {
		logger.createLogContainer(this.__root.parentElement);
		this.createdLogs = true;
	}

	const started = sniperEngine.start();

	if (started) {
		this.searchInProgress = true;
	}
};

const stop = function (this: any) {
	const stopped = sniperEngine.stop();
	if (stopped) {
		this.searchInProgress = false;
	}
};

const UTMarketSearchFiltersViewController__generate =
	UTMarketSearchFiltersViewController.prototype._generate;
const UTMarketSearchFiltersView__generate =
	UTMarketSearchFiltersView.prototype._generate;

UTMarketSearchFiltersViewController.prototype._generate = function _generate() {
	UTMarketSearchFiltersViewController__generate.call(this);
};

UTMarketSearchFiltersView.prototype._generate = function _generate() {
	UTMarketSearchFiltersView__generate.call(this);
	this.__root.style = "flex: 1;";

	const btnContainer = document.createElement("div");
	btnContainer.classList.add("button-container");
	btnContainer.style.cssText = `
		display: flex;
		align-items: center;
		gap: 10px;
	`;

	this._startButton = ButtonFactory.createCustomButton(
		"Start",
		() => {
			start.call(this);
			this._startButton.textContent = "Running...";
			this._startButton.style.opacity = "0.6";
			this._stopButton.style.opacity = "1";
		},
		"success",
	);

	this._stopButton = ButtonFactory.createCustomButton(
		"Stop",
		() => {
			stop.call(this);
			this._startButton.textContent = "Start";
			this._startButton.style.opacity = "1";
			this._stopButton.style.opacity = "0.6";
		},
		"danger",
	);
	this._stopButton.style.opacity = "0.6";

	this._clearButton = ButtonFactory.createCustomButton("Clear", () => {
		logger.clearLogs();
		this._clearButton.textContent = "Cleared";
		setTimeout(() => {
			this._clearButton.textContent = "Clear";
		}, 1000);
	});

	const filterButtonGroup = ButtonFactory.createButtonGroup([
		{
			text: "➕",
			onClick: () => {
				saveCurrentSearch.call(this);
				const addBtn = filterButtonGroup.children[0] as HTMLElement;
				if (filterManager.isEditing()) {
					addBtn.textContent = "Updated!";
				} else {
					addBtn.textContent = "Saved!";
				}
				setTimeout(() => {
					updateFilterButtons.call(this);
				}, 1000);
			},
		},
		{
			text: "🖊️",
			onClick: () => {
				if (filterManager.getFilterCount() > 0) {
					createFilterModal.call(this);
				}
			},
		},
		{
			text: "✖",
			onClick: () => {
				filterManager.cancelEditing();
				updateFilterButtons.call(this);
			},
		},
	]);

	this._addButton = filterButtonGroup.children[0] as HTMLElement;
	this._manageButton = filterButtonGroup.children[1] as HTMLElement;
	this._cancelButton = filterButtonGroup.children[2] as HTMLElement;

	btnContainer.appendChild(this._clearButton);
	btnContainer.appendChild(this._stopButton);
	btnContainer.appendChild(this._startButton);
	btnContainer.appendChild(filterButtonGroup);

	const settingsContainer = settingsPanel.createSettingsContainer();

	updateFilterButtons.call(this);

	this.updateFilterButtons = () => updateFilterButtons.call(this);

	insertAfter(btnContainer, select(".button-container", this.__root));
	insertAfter(settingsContainer, btnContainer);
};

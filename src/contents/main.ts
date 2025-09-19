import type { PlasmoCSConfig } from "plasmo";
import { insertAfter, select } from "~/domain/dom";
import { Logger } from "~/domain/logger";
import { type SniperSettings, SniperUI } from "~/domain/ui";

export const config: PlasmoCSConfig = {
	all_frames: false,
	matches: ["https://*.ea.com/*"],
	run_at: "document_end",
	world: "MAIN",
};

const logger = new Logger();
const seenTradeIds = new Set<number>();

let searchTimeoutId: NodeJS.Timeout | null = null;
let currentCycleCount = 0;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
const savedSearches: any[] = [];
const MAX_RESULTS_SAFEGUARD = 5;
const FILTERS_STORAGE_KEY = "fc26_saved_filters";

const loadSavedFilters = () => {
	try {
		const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
		if (saved) {
			savedSearches.length = 0;
			savedSearches.push(...JSON.parse(saved));
		}
	} catch (e) {
		console.log("Failed to load saved filters:", e);
	}
};

const saveFiltersToStorage = () => {
	try {
		localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(savedSearches));
	} catch (e) {
		console.log("Failed to save filters:", e);
	}
};

const settings: SniperSettings = {
	isDryRun: false,
	isSoundEnabled: true,
	searchDelays: [200, 300, 400, 500, 600, 700, 800, 900, 1000],
	cycleCount: 10,
	cyclePause: [5000, 10000, 15000, 20000, 25000],
};

const sniperUI = new SniperUI(settings, (newSettings) => {
	Object.assign(settings, newSettings);
});

const playSound = (frequency: number, duration: number = 200) => {
	if (!settings.isSoundEnabled) return;

	try {
		const audioContext = new (
			window.AudioContext || (window as any).webkitAudioContext
		)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.value = frequency;
		oscillator.type = "sine";

		gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			audioContext.currentTime + duration / 1000,
		);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + duration / 1000);
	} catch (e) {
		console.log("Sound playback failed:", e);
	}
};

const sounds = {
	playersFound: () => playSound(800, 150),
	buySuccess: () => playSound(1200, 200),
	buyFailed: () => playSound(400, 300),
	captcha: () => playSound(300, 800),
	criticalError: () => playSound(200, 800),
};

const searchErrorHandler = (response: any, context: any) => {
	let shouldStopBot = false;

	if (
		response.status === "CAPTCHA_REQUIRED" ||
		(response.error && response.error.code === "CAPTCHA_REQUIRED") ||
		response.status === 521 ||
		response.status === 429
	) {
		shouldStopBot = true;
		logger.addLog("🤖 CAPTCHA detected - stopping sniper", "error");
		sounds.captcha();
	} else if (response.status === 512 || response.status === 503) {
		shouldStopBot = true;
		logger.addLog("Server maintenance detected - stopping sniper", "error");
		sounds.criticalError();
	} else {
		consecutiveFailures++;

		if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
			shouldStopBot = true;
			logger.addLog(
				`Search failed ${consecutiveFailures} times consecutively - auto-stopping`,
				"error",
			);
			sounds.criticalError();
		} else {
			logger.addLog(
				`Search failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}) - Status: ${response.status}`,
				"error",
			);
		}
	}

	if (shouldStopBot) {
		context.searchInProgress = false;
		if (searchTimeoutId) {
			clearTimeout(searchTimeoutId);
			searchTimeoutId = null;
		}
		return true;
	}

	return false;
};

const createFilterDescription = (playerData: any, searchCriteria: any) => {
	let description = "";

	if (playerData?.firstName) {
		description = `${playerData.firstName} ${playerData.lastName || ""} (${playerData.rating || "?"})`;
	} else {
		description = "Any Player";
	}

	const buyRange = `${searchCriteria.minBuy || 0}-${searchCriteria.maxBuy || 0}`;
	const bidRange = searchCriteria.maxBid ? ` | Bid: ${searchCriteria.maxBid}` : "";

	return `${description} | Buy: ${buyRange}${bidRange}`;
};

const saveCurrentSearch = function (this: any) {
	const controller = getAppMain()
		.getRootViewController()
		.getPresentedViewController()
		.getCurrentViewController()
		.getCurrentController();

	const searchCriteria = controller.viewmodel.searchCriteria;
	const playerData = controller.viewmodel.playerData;

	const filterData = {
		playerData: playerData ? JSON.parse(JSON.stringify(playerData)) : null,
		searchCriteria: JSON.parse(JSON.stringify(searchCriteria)),
		timestamp: Date.now(),
		description: createFilterDescription(playerData, searchCriteria)
	};

	savedSearches.push(filterData);
	saveFiltersToStorage();

	logger.addLog(`Filter saved: ${filterData.description}`, "system");

	updateFilterButtons.call(this);
};

const createFilterModal = function (this: any) {
	const modal = document.createElement("div");
	modal.style.cssText = `
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #2a2a2a;
		border: 2px solid #00ff88;
		border-radius: 8px;
		padding: 20px;
		z-index: 10000;
		max-width: 500px;
		max-height: 400px;
		overflow-y: auto;
		box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
	`;

	const title = document.createElement("h3");
	title.textContent = "Saved Filters";
	title.style.cssText = "color: #00ff88; margin: 0 0 15px 0; font-size: 16px;";

	const filterList = document.createElement("div");
	filterList.style.cssText = "display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;";

	savedSearches.forEach((filter, index) => {
		const filterRow = document.createElement("div");
		filterRow.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px;
			background: #333;
			border-radius: 4px;
			color: white;
			font-size: 12px;
		`;

		const filterText = document.createElement("span");
		filterText.textContent = filter.description;
		filterText.style.flex = "1";

		const buttonGroup = document.createElement("div");
		buttonGroup.style.cssText = "display: flex; gap: 5px;";

		const selectBtn = document.createElement("button");
		selectBtn.textContent = "Select";
		selectBtn.style.cssText = `
			background: #00ff88;
			color: black;
			border: none;
			padding: 4px 8px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 10px;
		`;

		const deleteBtn = document.createElement("button");
		deleteBtn.textContent = "Delete";
		deleteBtn.style.cssText = `
			background: #ff4444;
			color: white;
			border: none;
			padding: 4px 8px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 10px;
		`;

		selectBtn.addEventListener("click", () => {
			loadFilter.call(this, filter);
			document.body.removeChild(modal);
		});

		deleteBtn.addEventListener("click", () => {
			savedSearches.splice(index, 1);
			saveFiltersToStorage();
			logger.addLog(`Filter deleted: ${filter.description}`, "system");
			updateFilterButtons.call(this);
			document.body.removeChild(modal);
		});

		buttonGroup.appendChild(selectBtn);
		buttonGroup.appendChild(deleteBtn);
		filterRow.appendChild(filterText);
		filterRow.appendChild(buttonGroup);
		filterList.appendChild(filterRow);
	});

	const footer = document.createElement("div");
	footer.style.cssText = "display: flex; gap: 10px; justify-content: flex-end;";

	const clearAllBtn = document.createElement("button");
	clearAllBtn.textContent = "Clear All";
	clearAllBtn.style.cssText = `
		background: #ff6600;
		color: white;
		border: none;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
	`;

	const closeBtn = document.createElement("button");
	closeBtn.textContent = "Close";
	closeBtn.style.cssText = `
		background: #666;
		color: white;
		border: none;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
	`;

	clearAllBtn.addEventListener("click", () => {
		savedSearches.length = 0;
		saveFiltersToStorage();
		logger.addLog("All filters cleared", "system");
		updateFilterButtons.call(this);
		document.body.removeChild(modal);
	});

	closeBtn.addEventListener("click", () => {
		document.body.removeChild(modal);
	});

	footer.appendChild(clearAllBtn);
	footer.appendChild(closeBtn);

	modal.appendChild(title);
	modal.appendChild(filterList);
	modal.appendChild(footer);

	document.body.appendChild(modal);
};

const loadFilter = function (this: any, filterData: any) {
	try {
		const controller = getAppMain()
			.getRootViewController()
			.getPresentedViewController()
			.getCurrentViewController()
			.getCurrentController();

		if (filterData.playerData) {
			controller.viewmodel.playerData = filterData.playerData;
		}

		Object.assign(controller.viewmodel.searchCriteria, filterData.searchCriteria);

		controller.viewDidAppear();

		logger.addLog(`Filter loaded: ${filterData.description}`, "success");
	} catch {
		logger.addLog("Failed to load filter", "error");
	}
};

const updateFilterButtons = function (this: any) {
	if (this._manageButton) {
		if (savedSearches.length === 0) {
			this._manageButton.textContent = "🖊️";
			this._manageButton.style.opacity = "0.5";
		} else {
			this._manageButton.textContent = `🖊️ ${savedSearches.length}`;
			this._manageButton.style.opacity = "1";
		}
	}
};

export const sendPinEvents = (pageId) => {
	services.PIN.sendData(PINEventType.PAGE_VIEW, {
		type: PIN_PAGEVIEW_EVT_TYPE,
		pgid: pageId,
	});
};

const buy = function (this: any, player: any, price: number) {
	const playerName = `${player._staticData.firstName} ${player._staticData.lastName}`;
	const tradeId = player._auction.tradeId;

	if (settings.isDryRun) {
		logger.addLog(
			`${playerName} [${tradeId}] ${price} [DRY RUN] simulated buy`,
			"system",
		);
		sounds.buySuccess();
		return;
	}

	logger.addLog(`${playerName} [${tradeId}] ${price} buying`, "info");

	services.Item.bid(player, price).observe(this, (_, data) => {
		if (!data.success) {
			logger.addLog(`${playerName} [${tradeId}] ${price} buy failed`, "error");
			sounds.buyFailed();
			return;
		}

		logger.addLog(`${playerName} [${tradeId}] ${price} bought`, "success");
		sounds.buySuccess();
	});
};

const start = function (this: any) {
	if (!this.createdLogs) {
		logger.createLogContainer(this.__root.parentElement);
		this.createdLogs = true;
	}

	logger.repositionLogContainer();

	if (this.searchInProgress) {
		logger.addLog("Search already in progress", "error");
		return;
	}

	this.searchInProgress = true;
	currentCycleCount = 0;
	logger.addLog("Search started", "info");

	const performSearch = () => {
		if (!this.searchInProgress) {
			return;
		}

		const searchCriteria = getAppMain()
			.getRootViewController()
			.getPresentedViewController()
			.getCurrentViewController()
			.getCurrentController().viewmodel.searchCriteria;

		services.Item.clearTransferMarketCache();

		searchCriteria.maxBid =
			Math.round((Math.random() * (800000 - 300000) + 300000) / 1000) * 1000;

		services.Item.searchTransferMarket(searchCriteria, 1).observe(
			this,
			(_, response) => {
				if (!this.searchInProgress) {
					logger.addLog("Search stopped", "info");
					return;
				}

				if (!response.success) {
					const stopped = searchErrorHandler(response, this);
					if (stopped) return;
				} else {
					consecutiveFailures = 0;

					if (response.data.items.length > MAX_RESULTS_SAFEGUARD) {
						logger.addLog(`SAFEGUARD: Too many results (${response.data.items.length}) - STOPPING to prevent mass buying!`, "error");
						sounds.criticalError();
						this.searchInProgress = false;
						if (searchTimeoutId) {
							clearTimeout(searchTimeoutId);
							searchTimeoutId = null;
						}
						return;
					}

					if (response.data.items.length > 0) {
						sendPinEvents("Transfer Market Results - List View");
						logger.addLog(`Found ${response.data.items.length} items`, "info");
						sounds.playersFound();
					}

					response.data.items.sort((a: any, b: any) => {
						const priceDiff = a._auction.buyNowPrice - b._auction.buyNowPrice;
						if (priceDiff !== 0) {
							return priceDiff;
						}
						return a._auction.expires - b._auction.expires;
					});

					for (let i = 0; i < response.data.items.length; i++) {
						const player = response.data.items[i];
						const auction = player._auction;
						const buyNowPrice = auction.buyNowPrice;
						const tradeId = auction.tradeId;
						const tradeState = auction.tradeState;

						if (seenTradeIds.has(tradeId)) {
							continue;
						}

						seenTradeIds.add(tradeId);

						const expires = services.Localization.localizeAuctionTimeRemaining(
							auction.expires,
						);

						logger.addLog(
							`${player._staticData.firstName} ${player._staticData.lastName} [${tradeId} | ${tradeState}] [${expires}] ${buyNowPrice}`,
							"info",
						);

						buy.call(this, player, buyNowPrice);
					}
				}

				sendPinEvents("Transfer Market Search");

				currentCycleCount++;

				if (currentCycleCount >= settings.cycleCount) {
					currentCycleCount = 0;
					const randomDelay =
						settings.cyclePause[
						Math.floor(Math.random() * settings.cyclePause.length)
						];
					logger.addLog(
						`Cycle complete (${settings.cycleCount} searches) - pausing for ${randomDelay}ms`,
						"system",
					);
					searchTimeoutId = setTimeout(performSearch, randomDelay);
				} else {
					const randomDelay =
						settings.searchDelays[
						Math.floor(Math.random() * settings.searchDelays.length)
						];
					searchTimeoutId = setTimeout(performSearch, randomDelay);
				}
			},
		);
	};

	performSearch();
};

const stop = function (this: any) {
	if (!this.searchInProgress) {
		logger.addLog("No search in progress", "error");
		return;
	}

	this.searchInProgress = false;

	if (searchTimeoutId) {
		clearTimeout(searchTimeoutId);
		searchTimeoutId = null;
	}

	seenTradeIds.clear();

	logger.addLog("Search stopped", "info");
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

	this._startButton = sniperUI.createCustomButton("Start", () => {
		start.call(this);
		this._startButton.textContent = "Running...";
		this._startButton.style.opacity = "0.6";
		this._stopButton.style.opacity = "1";
	}, "success");

	this._stopButton = sniperUI.createCustomButton("Stop", () => {
		stop.call(this);
		this._startButton.textContent = "Start";
		this._startButton.style.opacity = "1";
		this._stopButton.style.opacity = "0.6";
	}, "danger");
	this._stopButton.style.opacity = "0.6";

	this._clearButton = sniperUI.createCustomButton("Clear", () => {
		logger.clearLogs();
		this._clearButton.textContent = "Cleared";
		setTimeout(() => {
			this._clearButton.textContent = "Clear";
		}, 1000);
	});

	const filterButtonGroup = sniperUI.createButtonGroup([
		{
			text: "➕",
			onClick: () => {
				saveCurrentSearch.call(this);
				const addBtn = filterButtonGroup.children[0] as HTMLElement;
				addBtn.textContent = "Saved!";
				setTimeout(() => {
					addBtn.textContent = "➕";
				}, 1000);
			}
		},
		{
			text: "🖊️",
			onClick: () => {
				if (savedSearches.length > 0) {
					createFilterModal.call(this);
				}
			}
		}
	]);

	this._manageButton = filterButtonGroup.children[1] as HTMLElement;

	btnContainer.appendChild(this._clearButton);
	btnContainer.appendChild(this._stopButton);
	btnContainer.appendChild(this._startButton);
	btnContainer.appendChild(filterButtonGroup);

	const settingsContainer = sniperUI.createSettingsContainer();

	loadSavedFilters();
	updateFilterButtons.call(this);

	insertAfter(btnContainer, select(".button-container", this.__root));
	insertAfter(settingsContainer, btnContainer);
};

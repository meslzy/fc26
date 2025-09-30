import { getNextLowerValidPrice, getValidPrice } from "~/composables/price";

export class ProfitService {
	private profitDisplay: HTMLElement;
	private maxBuyPrice = 0;
	private sellPrice = 0;

	private readonly EA_TAX_RATE = 0.05;

	private calculateProfit(): number {
		if (this.maxBuyPrice <= 0) return 0;
		return Math.floor(this.sellPrice * (1 - this.EA_TAX_RATE) - this.maxBuyPrice);
	}

	private calculateProfitPercentage(): number {
		if (this.maxBuyPrice <= 0) return 0;
		const profit = this.calculateProfit();
		return (profit / this.maxBuyPrice) * 100;
	}

	private getProfitColor(profitPercentage: number): string {
		if (profitPercentage > 5) return "#00ff00";
		if (profitPercentage >= 0) return "#ffff00";
		return "#ff0000";
	}

	private suggestBuyPrice(): number {
		if (this.maxBuyPrice <= 0) return 0;
		return getNextLowerValidPrice(this.maxBuyPrice);
	}

	private suggestSellPrice(): number {
		if (this.maxBuyPrice <= 0) return 0;
		const targetProfit = this.maxBuyPrice * 0.05;
		const sellPrice = (this.maxBuyPrice + targetProfit) / (1 - this.EA_TAX_RATE);
		return getValidPrice(Math.ceil(sellPrice));
	}

	private updateDisplay() {
		if (!this.profitDisplay) return;

		if (this.maxBuyPrice <= 0) {
			this.profitDisplay.style.display = "none";
			return;
		}

		this.profitDisplay.style.display = "flex";

		if (this.sellPrice <= 0) {
			const buyAt = this.suggestBuyPrice();
			const sellAt = this.suggestSellPrice();
			this.profitDisplay.innerHTML = `
				<span style="color: #888;">Suggested:</span>
				<span style="color: #1fc3c1;">Buy at ${buyAt.toLocaleString()}</span>
				<span style="color: #888;">•</span>
				<span style="color: #1fc3c1;">Sell at ${sellAt.toLocaleString()}</span>
			`;
		} else {
			const profit = this.calculateProfit();
			const profitPercentage = this.calculateProfitPercentage();
			const color = this.getProfitColor(profitPercentage);

			this.profitDisplay.innerHTML = `
				<span style="color: #888;">Profit:</span>
				<span style="color: ${color}; font-weight: bold;">
					${profit >= 0 ? "+" : ""}${profit.toLocaleString()} coins (${profitPercentage.toFixed(1)}%)
				</span>
			`;
		}
	}

	private createProfitDisplay(): HTMLElement {
		const container = document.createElement("div");
		container.style.display = "none";
		container.style.alignItems = "center";
		container.style.justifyContent = "center";
		container.style.gap = "8px";
		container.style.padding = "8px 16px";
		container.style.fontSize = "14px";
		container.style.fontWeight = "500";
		container.style.borderRadius = "4px";
		container.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
		container.style.margin = "0 10px";

		return container;
	}

	private onMaxBuyPriceChange = (maxBuy: number) => {
		this.maxBuyPrice = maxBuy;
		this.updateDisplay();
	};

	private onSellPriceChange = (sellPrice: number) => {
		this.sellPrice = sellPrice;
		this.updateDisplay();
	};

	constructor() {
		this.profitDisplay = this.createProfitDisplay();
		this.updateDisplay();
	}

	init(container: HTMLElement) {
		const that = this;

		container.appendChild(this.profitDisplay);

		const UTMarketSearchFiltersViewController_viewDidAppear =
			UTMarketSearchFiltersViewController.prototype.viewDidAppear;

		UTMarketSearchFiltersViewController.prototype.viewDidAppear = function () {
			UTMarketSearchFiltersViewController_viewDidAppear.call(this);

			const maxBuy = this.viewmodel.searchCriteria?.maxBuy || 0;
			const sellPrice = this.viewmodel.searchCriteria?.sellPrice || 0;

			that.onMaxBuyPriceChange(maxBuy);
			that.onSellPriceChange(sellPrice);
		};

		const UTMarketSearchFiltersViewController_eMaxBuyPriceChanged =
			UTMarketSearchFiltersViewController.prototype.eMaxBuyPriceChanged;

		UTMarketSearchFiltersViewController.prototype.eMaxBuyPriceChanged = function (_a, _e, f) {
			UTMarketSearchFiltersViewController_eMaxBuyPriceChanged.call(this, _a, _e, f);
			that.onMaxBuyPriceChange(f.value);
		};

		const UTMarketSearchFiltersViewController_eSellPriceChanged =
			UTMarketSearchFiltersViewController.prototype.eSellPriceChanged;

		UTMarketSearchFiltersViewController.prototype.eSellPriceChanged = function (_a, _e, f) {
			UTMarketSearchFiltersViewController_eSellPriceChanged.call(this, _a, _e, f);
			that.onSellPriceChange(f.value);
		};
	}
}

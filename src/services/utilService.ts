
export class UtilService {
  private profitLabel: HTMLElement;

  private parseFormattedNumber(value: string): number {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  }

  private getValidBuyPrice(price: number): number {
    if (price <= 1000) {
      return Math.floor(price / 50) * 50;
    }
    if (price <= 10000) {
      return Math.floor(price / 100) * 100;
    }
    if (price <= 50000) {
      return Math.floor(price / 250) * 250;
    }
    if (price <= 100000) {
      return Math.floor(price / 500) * 500;
    }
    return Math.floor(price / 1000) * 1000;
  }

  private calculateMaxBuyPrice(sellPrice: number): number {
    const maxBuyPrice = sellPrice * 0.95;
    return this.getValidBuyPrice(maxBuyPrice);
  }

  private updateProfitLabel(sellPrice: number) {
    if (sellPrice > 0) {
      const maxBuyPrice = this.calculateMaxBuyPrice(sellPrice);
      this.profitLabel.textContent = `Buy for ${maxBuyPrice.toLocaleString()} for minimum profit (0% loss)`;
    } else {
      this.profitLabel.textContent = "";
    }
  }

  private createProfitLabel(): HTMLElement {
    this.profitLabel = document.createElement("div");
    this.profitLabel.style.cssText = `
			color: #1fc3c1;
			font-size: 11px;
			font-weight: bold;
			margin-top: 4px;
			text-align: center;
		`;

    return this.profitLabel;
  }

  private improrveBuyMaxPriceFilter(buyMaxPriceFilter: Element) {
    const buyMaxPriceInput = buyMaxPriceFilter.querySelector("input");
    const crementButtons = buyMaxPriceFilter.querySelectorAll("button");

    crementButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setTimeout(() => {
          const sellPrice = this.parseFormattedNumber(buyMaxPriceInput.value);
          this.updateProfitLabel(sellPrice);
        }, 0);
      });
    });

    const updateFromInput = () => {
      const sellPrice = this.parseFormattedNumber(buyMaxPriceInput.value);
      this.updateProfitLabel(sellPrice);
    };

    buyMaxPriceInput.addEventListener("input", updateFromInput);

    buyMaxPriceFilter.appendChild(this.profitLabel);

    this.updateProfitLabel(this.parseFormattedNumber(buyMaxPriceInput.value));
  }

  constructor() {
    this.createProfitLabel();
  }

  init = (container: HTMLElement) => {
    const priceFilters = container.querySelectorAll(".price-filter");
    const buyMaxPriceFilter = priceFilters[priceFilters.length - 1];
    this.improrveBuyMaxPriceFilter(buyMaxPriceFilter);
  };
}

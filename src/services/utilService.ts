
import { getValidPrice } from "~/core/price";

export class UtilService {
  private profitLabel: HTMLElement;

  private parseFormattedNumber(value: string): number {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  }

  private updateProfitLabel(sellPrice: number) {
    if (sellPrice > 0) {
      const maxBuyPrice = getValidPrice(sellPrice * 0.95);
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

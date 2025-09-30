import type { FutggPlayerPrice } from "~/api/futgg";
import { contentMessaging } from "~/shared/messaging/contentMessaging";

export class CardPlugin {
	private priceCache = new Map<number, FutggPlayerPrice>();
	private pendingRequests = new Set<number>();
	private batchTimeout: NodeJS.Timeout | null = null;
	private requestCallbacks = new Map<number, Array<(priceData?: FutggPlayerPrice) => void>>();

	private async processBatch() {
		if (this.pendingRequests.size === 0) return;

		const idsToFetch = Array.from(this.pendingRequests);
		this.pendingRequests.clear();
		this.batchTimeout = null;

		try {
			const prices = await contentMessaging.sendMessage("getPlayerPrices", idsToFetch);

			for (const priceData of prices) {
				this.priceCache.set(priceData.eaId, priceData);

				const callbacks = this.requestCallbacks.get(priceData.eaId);
				if (callbacks) {
					callbacks.forEach((callback) => {
						callback(priceData);
					});
					this.requestCallbacks.delete(priceData.eaId);
				}
			}

			for (const id of idsToFetch) {
				const callbacks = this.requestCallbacks.get(id);
				if (callbacks && !this.priceCache.has(id)) {
					callbacks.forEach((callback) => {
						callback(undefined);
					});
					this.requestCallbacks.delete(id);
				}
			}
		} catch (error) {
			console.error("Failed to fetch batch prices:", error);

			for (const id of idsToFetch) {
				const callbacks = this.requestCallbacks.get(id);
				if (callbacks) {
					callbacks.forEach((callback) => {
						callback(undefined);
					});
					this.requestCallbacks.delete(id);
				}
			}
		}
	}

	private addToBatch(definitionId: number) {
		if (this.priceCache.has(definitionId) || this.pendingRequests.has(definitionId)) {
			return;
		}

		this.pendingRequests.add(definitionId);

		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
		}

		this.batchTimeout = setTimeout(() => {
			this.processBatch();
		}, 1000);
	}

	private createPriceElement(priceData: FutggPlayerPrice, item: any): HTMLElement {
		const priceElement = document.createElement("div");

		priceElement.style.position = "absolute";
		priceElement.style.zIndex = "2";
		priceElement.style.fontWeight = "300";
		priceElement.style.textAlign = "center";
		priceElement.style.top = "0";
		priceElement.style.left = "50%";
		priceElement.style.transform = "translateX(-50%)";
		priceElement.style.background = "#13151d";
		priceElement.style.padding = "2px 6px";
		priceElement.style.fontSize = "10px";
		priceElement.style.whiteSpace = "nowrap";

		if (item?.untradeable && !item?.getAuctionData?.()?.isSold?.()) {
			priceElement.style.color = "#f7b702";
		} else {
			priceElement.style.color = "white";
		}

		let priceContent = "";
		let priceDiff = "";

		if (item?.lastSalePrice && item.lastSalePrice !== 0 && priceData.price !== null) {
			const current = priceData.price;
			const last = item.lastSalePrice;
			const diff = current - last;
			const percentage = Math.round((diff / last) * 100);
			const sign = diff >= 0 ? "+" : "";
			priceDiff = `<span style="color: ${diff >= 0 ? "#4CAF50" : "#f44336"}; font-size: 0.7rem;"> (${sign}${percentage}%)</span>`;
		}

		if (priceData.isExtinct) {
			priceContent = "EXTINCT";
		} else if (priceData.isObjective) {
			priceContent = "OBJECTIVE";
		} else if (priceData.price !== null) {
			priceContent = `${priceData.price.toLocaleString()}${priceDiff}`;
		} else {
			priceContent = "N/A";
		}

		priceElement.innerHTML = priceContent;

		return priceElement;
	}

	private async addPriceElement(item: any) {
		const priceData = this.priceCache.get(item.definitionId);

		if (priceData) {
			return this.createPriceElement(priceData, item);
		}

		return new Promise<HTMLElement | undefined>((resolve) => {
			if (!this.requestCallbacks.has(item.definitionId)) {
				this.requestCallbacks.set(item.definitionId, []);
			}

			this.requestCallbacks.get(item.definitionId)!.push((priceData) => {
				if (priceData) {
					resolve(this.createPriceElement(priceData, item));
				} else {
					resolve(undefined);
				}
			});

			this.addToBatch(item.definitionId);
		});
	}

	init() {
		const that = this;

		const UTPlayerItemView_renderItem = UTPlayerItemView.prototype.renderItem;

		UTPlayerItemView.prototype.renderItem = async function (...args: any[]) {
			const item = args[0];

			const result = UTPlayerItemView_renderItem.call(this, ...args);

			if (item.definitionId > 0) {
				const priceElement = await that.addPriceElement(item);
				if (this.__root && priceElement) this.__root.prepend(priceElement);
			}

			return result;
		};
	}
}

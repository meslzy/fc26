export class StaticService {
	private statsContainer: HTMLElement;
	private statsMap: Map<string, HTMLElement> = new Map();
	private originalValues: Map<string, string> = new Map();

	private resetStat(key: string) {
		if (!this.originalValues.has(key)) return;

		const statItem = this.statsMap.get(key)!;
		const labelElement = statItem.querySelector("div:first-child") as HTMLElement;
		const valueElement = statItem.querySelector("div:last-child") as HTMLElement;
		const originalLabel = labelElement.textContent;
		const originalValue = this.originalValues.get(key)!;

		let animationCount = 0;

		const symbols = ["$", "&", "*", "#", "@", "%", "!", "?", "^", "~"];

		labelElement.textContent = "Reset";

		const animateSymbols = () => {
			if (animationCount < 8) {
				const randomSymbols = Array.from(
					{ length: originalValue.length || 3 },
					() => symbols[Math.floor(Math.random() * symbols.length)],
				).join("");
				valueElement.textContent = randomSymbols;
				animationCount++;
				setTimeout(animateSymbols, 60);
			} else {
				labelElement.textContent = originalLabel;
				valueElement.textContent = originalValue;
			}
		};

		animateSymbols();
	}

	private createStatsContainer() {
		this.statsContainer = document.createElement("div");
		this.statsContainer.style.backgroundColor = "#201f26";
		this.statsContainer.style.borderRadius = "16px";
		this.statsContainer.style.overflow = "hidden";
		this.statsContainer.style.padding = "16px";
		this.statsContainer.style.display = "grid";
		this.statsContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(150px, 1fr))";
		this.statsContainer.style.gap = "12px";
	}

	private createStatItem(key: string, value: string): HTMLElement {
		const statItem = document.createElement("div");
		statItem.style.background = "#2d2c36";
		statItem.style.borderRadius = "8px";
		statItem.style.padding = "8px";
		statItem.style.height = "max-content";
		statItem.style.textAlign = "center";
		statItem.style.transition = "all 0.3s ease";
		statItem.style.cursor = "pointer";

		const statLabel = document.createElement("div");
		statLabel.style.color = "#888";
		statLabel.style.fontSize = "11px";
		statLabel.style.fontWeight = "bold";
		statLabel.style.textTransform = "uppercase";
		statLabel.style.letterSpacing = "1px";
		statLabel.style.marginBottom = "4px";
		statLabel.textContent = key;

		const statValue = document.createElement("div");
		statValue.style.color = "#fcfcfc";
		statValue.style.fontSize = "18px";
		statValue.style.fontWeight = "bold";
		statValue.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.5)";
		statValue.textContent = value;

		statItem.appendChild(statLabel);
		statItem.appendChild(statValue);

		statItem.addEventListener("click", () => this.resetStat(key));

		return statItem;
	}

	constructor(initialStats: Record<string, string>) {
		this.createStatsContainer();

		for (const [key, value] of Object.entries(initialStats)) {
			this.set(key, value);
			this.originalValues.set(key, value);
		}
	}

	init = (container: HTMLElement) => {
		container.appendChild(this.statsContainer);
	};

	set(key: string, value: string) {
		if (this.statsMap.has(key)) {
			const statItem = this.statsMap.get(key)!;
			const valueElement = statItem.querySelector("div:last-child") as HTMLElement;
			valueElement.textContent = value;
		} else {
			const statItem = this.createStatItem(key, value);
			this.statsMap.set(key, statItem);
			this.statsContainer.appendChild(statItem);
		}
	}

	get(key: string): string {
		if (this.statsMap.has(key)) {
			const statItem = this.statsMap.get(key)!;
			const valueElement = statItem.querySelector("div:last-child") as HTMLElement;
			return valueElement.textContent || "0";
		}
		return "0";
	}

	increment(key: string) {
		const current = this.get(key);
		const newValue = (parseInt(current, 10) || 0) + 1;
		this.set(key, newValue.toString());
	}

	decrement(key: string) {
		const current = this.get(key);
		const newValue = Math.max((parseInt(current, 10) || 0) - 1, 0);
		this.set(key, newValue.toString());
	}

	remove(key: string) {
		if (this.statsMap.has(key)) {
			const statItem = this.statsMap.get(key)!;
			this.statsContainer.removeChild(statItem);
			this.statsMap.delete(key);
		}
	}
}

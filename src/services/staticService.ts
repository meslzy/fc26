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

		const symbols = ['$', '&', '*', '#', '@', '%', '!', '?', '^', '~'];

		labelElement.textContent = "Reset";

		const animateSymbols = () => {
			if (animationCount < 8) {
				const randomSymbols = Array.from({ length: originalValue.length || 3 }, () =>
					symbols[Math.floor(Math.random() * symbols.length)]
				).join('');
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
		this.statsContainer.style.cssText = `
			background-color: #201f26;
			border-radius: 16px;
			overflow: hidden;
			padding: 16px;
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 12px;
		`;
	}

	private createStatItem(key: string, value: string): HTMLElement {
		const statItem = document.createElement("div");
		statItem.style.cssText = `
			background: #2d2c36;
			border-radius: 8px;
			padding: 8px;
			height: max-content;
			text-align: center;
			transition: all 0.3s ease;
			cursor: pointer;
		`;

		const statLabel = document.createElement("div");
		statLabel.style.cssText = `
			color: #888;
			font-size: 11px;
			font-weight: bold;
			text-transform: uppercase;
			letter-spacing: 1px;
			margin-bottom: 4px;
		`;
		statLabel.textContent = key;

		const statValue = document.createElement("div");
		statValue.style.cssText = `
			color: #fcfcfc;
			font-size: 18px;
			font-weight: bold;
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		`;
		statValue.textContent = value;

		statItem.appendChild(statLabel);
		statItem.appendChild(statValue);

		statItem.addEventListener("click", () => this.resetStat(key));

		return statItem;
	}

	constructor() {
		this.createStatsContainer();
		this.set("Searches", "0");
		this.set("Wins", "0");
		this.set("Fails", "0");
		this.originalValues.set("Searches", "0");
		this.originalValues.set("Wins", "0");
		this.originalValues.set("Fails", "0");
	}

	init = (container: HTMLElement) => {
		container.appendChild(this.statsContainer);
	};

	set(key: string, value: string) {
		if (!this.originalValues.has(key)) {
			this.originalValues.set(key, value);
		}

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

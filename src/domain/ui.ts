export interface SniperSettings {
	isDryRun: boolean;
	isSoundEnabled: boolean;
	searchDelays: number[];
	cycleCount: number;
	cyclePause: number[];
}

export class SniperUI {
	private settings: SniperSettings;
	private onSettingsChange: (settings: SniperSettings) => void;
	private readonly STORAGE_KEY = "fc26_sniper_settings";

	constructor(initialSettings: SniperSettings, onSettingsChange: (settings: SniperSettings) => void) {
		this.settings = this.loadSettings(initialSettings);
		this.onSettingsChange = onSettingsChange;
		this.onSettingsChange(this.settings);
	}

	private loadSettings(defaults: SniperSettings): SniperSettings {
		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				return { ...defaults, ...parsed };
			}
		} catch (e) {
			console.log("Failed to load settings:", e);
		}
		return defaults;
	}

	private saveSettings() {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
		} catch (e) {
			console.log("Failed to save settings:", e);
		}
	}

	createSettingsContainer(): HTMLElement {
		const settingsContainer = document.createElement("div");
		settingsContainer.style.cssText = `
			height: 300px;
			background: #201f26;
			border: 1px solid #333;
			border-radius: 6px;
			padding: 12px;
			margin: 8px 0;
			display: flex;
			flex-direction: column;
			overflow: auto;
			gap: 12px;
		`;

		settingsContainer.appendChild(this.createToggleGroup());
		settingsContainer.appendChild(this.createConfigGroup());
		settingsContainer.appendChild(this.createProfitCalculator());

		return settingsContainer;
	}

	private createToggleGroup(): HTMLElement {
		const toggleGroup = document.createElement("div");
		toggleGroup.style.cssText = `
			display: flex;
			gap: 20px;
			padding: 8px 0;
			border-bottom: 1px solid #333;
		`;

		toggleGroup.appendChild(this.createCheckbox("dryRun", "🧪 Dry Run", this.settings.isDryRun, (checked) => {
			this.settings.isDryRun = checked;
			this.saveSettings();
			this.onSettingsChange(this.settings);
		}));

		toggleGroup.appendChild(this.createCheckbox("sound", "🔊 Sound", this.settings.isSoundEnabled, (checked) => {
			this.settings.isSoundEnabled = checked;
			this.saveSettings();
			this.onSettingsChange(this.settings);
		}));

		return toggleGroup;
	}

	private createConfigGroup(): HTMLElement {
		const configGroup = document.createElement("div");
		configGroup.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 10px;
		`;

		const inputsRow = document.createElement("div");
		inputsRow.style.cssText = "display: flex; gap: 12px;";

		inputsRow.appendChild(this.createNumberInput(
			"Delays (ms)",
			this.settings.searchDelays.join(","),
			(value) => {
				const delays = value.split(",").map(v => parseInt(v.trim(), 10)).filter(v => !Number.isNaN(v));
				if (delays.length > 0) {
					this.settings.searchDelays = delays;
					this.saveSettings();
					this.onSettingsChange(this.settings);
				}
			}
		));

		inputsRow.appendChild(this.createNumberInput(
			"Cycle Count (searches)",
			this.settings.cycleCount.toString(),
			(value) => {
				const count = parseInt(value, 10);
				if (!Number.isNaN(count) && count > 0) {
					this.settings.cycleCount = count;
					this.saveSettings();
					this.onSettingsChange(this.settings);
				}
			}
		));

		inputsRow.appendChild(this.createNumberInput(
			"Cycle Pause (ms)",
			this.settings.cyclePause.join(","),
			(value) => {
				const pauses = value.split(",").map(v => parseInt(v.trim(), 10)).filter(v => !Number.isNaN(v));
				if (pauses.length > 0) {
					this.settings.cyclePause = pauses;
					this.saveSettings();
					this.onSettingsChange(this.settings);
				}
			}
		));

		configGroup.appendChild(inputsRow);

		return configGroup;
	}

	private createProfitCalculator(): HTMLElement {
		const calcGroup = document.createElement("div");
		calcGroup.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding-top: 8px;
			border-top: 1px solid #333;
		`;

		const title = document.createElement("div");
		title.textContent = "Profit Calculator";
		title.style.cssText = "color: #00ff88; font-size: 12px; font-weight: bold;";

		const calcRow = document.createElement("div");
		calcRow.style.cssText = "display: flex; align-items: center; gap: 10px;";

		const input = document.createElement("input");
		input.type = "number";
		input.placeholder = "Enter price...";
		input.style.cssText = `
			background: #333;
			border: 1px solid #555;
			color: white;
			padding: 6px 8px;
			font-size: 11px;
			border-radius: 3px;
			width: 120px;
		`;

		const resultText = document.createElement("div");
		resultText.textContent = "Max buy price: -";
		resultText.style.cssText = "color: #ccc; font-size: 11px; flex: 1;";

		const calculateLowestBuyPrice = (salePrice: number) => {
			const tax = salePrice * 0.05;
			const netCoins = salePrice - tax;
			const roundedPrice = Math.floor(netCoins / 100) * 100;
			return roundedPrice;
		};

		input.addEventListener("input", () => {
			const value = parseInt(input.value, 10);
			if (!Number.isNaN(value) && value > 0) {
				const maxBuyPrice = calculateLowestBuyPrice(value);
				resultText.textContent = `Max buy price: ${maxBuyPrice} coins`;
				resultText.style.color = "#00ff88";
			} else {
				resultText.textContent = "Max buy price: -";
				resultText.style.color = "#ccc";
			}
		});

		const label = document.createElement("label");
		label.textContent = "Calc Profit:";
		label.style.cssText = "color: white; font-size: 11px; min-width: 70px;";

		calcRow.appendChild(label);
		calcRow.appendChild(input);
		calcRow.appendChild(resultText);

		calcGroup.appendChild(title);
		calcGroup.appendChild(calcRow);

		return calcGroup;
	}

	private createCheckbox(id: string, label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
		const container = document.createElement("div");
		container.style.cssText = "display: flex; align-items: center; color: white; font-size: 11px;";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.id = id;
		checkbox.checked = checked;
		checkbox.style.cssText = `
			width: 12px;
			height: 12px;
			margin-right: 6px;
			accent-color: #00ff88;
			cursor: pointer;
		`;
		checkbox.addEventListener("change", () => onChange(checkbox.checked));

		const labelEl = document.createElement("label");
		labelEl.htmlFor = id;
		labelEl.textContent = label;
		labelEl.style.cssText = "cursor: pointer; user-select: none;";

		container.appendChild(checkbox);
		container.appendChild(labelEl);

		return container;
	}

	createCustomButton(text: string, onClick: () => void, variant: "default" | "success" | "danger" = "default"): HTMLElement {
		const button = document.createElement("button");
		button.textContent = text;

		let bgColor = "#333";
		if (variant === "success") bgColor = "#28a745";
		if (variant === "danger") bgColor = "#dc3545";

		button.style.cssText = `
			background: ${bgColor};
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
			font-weight: bold;
			transition: all 0.2s ease;
			min-width: 60px;
		`;

		button.addEventListener("mouseenter", () => {
			button.style.opacity = "0.8";
			button.style.transform = "translateY(-1px)";
		});

		button.addEventListener("mouseleave", () => {
			button.style.opacity = "1";
			button.style.transform = "translateY(0)";
		});

		button.addEventListener("click", onClick);

		return button;
	}

	createButtonGroup(buttons: Array<{text: string, onClick: () => void, variant?: "default" | "success" | "danger"}>): HTMLElement {
		const group = document.createElement("div");
		group.style.cssText = `
			display: flex;
			border: 1px solid #555;
			border-radius: 4px;
			overflow: hidden;
			background: #222;
		`;

		buttons.forEach((btnConfig, index) => {
			const button = document.createElement("button");
			button.textContent = btnConfig.text;

			let bgColor = "#333";
			if (btnConfig.variant === "success") bgColor = "#28a745";
			if (btnConfig.variant === "danger") bgColor = "#dc3545";

			button.style.cssText = `
				background: ${bgColor};
				color: white;
				border: none;
				padding: 8px 12px;
				cursor: pointer;
				font-size: 12px;
				font-weight: bold;
				transition: all 0.2s ease;
				${index < buttons.length - 1 ? "border-right: 1px solid #555;" : ""}
			`;

			button.addEventListener("mouseenter", () => {
				button.style.opacity = "0.8";
			});

			button.addEventListener("mouseleave", () => {
				button.style.opacity = "1";
			});

			button.addEventListener("click", btnConfig.onClick);

			group.appendChild(button);
		});

		return group;
	}

	private createNumberInput(label: string, value: string, onChange: (value: string) => void): HTMLElement {
		const container = document.createElement("div");
		container.style.cssText = "flex: 1; display: flex; flex-direction: column;";

		const labelEl = document.createElement("label");
		labelEl.textContent = label;
		labelEl.style.cssText = "color: #ccc; font-size: 10px; margin-bottom: 4px;";

		const input = document.createElement("input");
		input.type = "text";
		input.value = value;
		input.style.cssText = `
			background: #333;
			border: 1px solid #555;
			color: white;
			padding: 4px 6px;
			font-size: 10px;
			border-radius: 3px;
			width: 100%;
		`;
		input.addEventListener("blur", () => onChange(input.value));
		input.addEventListener("keypress", (e) => {
			if (e.key === "Enter") onChange(input.value);
		});

		container.appendChild(labelEl);
		container.appendChild(input);

		return container;
	}
}

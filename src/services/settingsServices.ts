import { createButton } from "~/components/button";
import { createCheckbox, createCheckboxInput, createRangeInput } from "~/components/form";
import type { SettingsManager } from "~/managers/settingsManager";

export class SettingsService {
  private modal: HTMLElement;
  private modalTitle: HTMLHeadingElement;
  private modalContent: HTMLElement;
  private modalCloseButton: HTMLButtonElement;
  private tabContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private currentTab: string = "Search";
  private tabs: Map<string, () => HTMLElement> = new Map();

  private createModal() {
    this.modal = document.createElement("div");
    this.modal.classList.add("modal");
    this.modal.style.display = "none";
    this.modal.style.flexDirection = "column";
    this.modal.style.position = "absolute";
    this.modal.style.zIndex = "1000";
    this.modal.style.inset = "0";
    this.modal.style.overflow = "hidden";
    this.modal.style.backgroundColor = "rgb(32 31 38 / 95%)";

    this.modalTitle = document.createElement("h2");
    this.modalTitle.innerText = "Settings";
    this.modalTitle.style.color = "#fcfcfc";
    this.modalTitle.style.textAlign = "center";
    this.modalTitle.style.padding = "16px";

    this.modalContent = document.createElement("div");
    this.modalContent.style.flex = "1";
    this.modalContent.style.display = "flex";
    this.modalContent.style.overflow = "hidden";
    this.modalContent.style.padding = "16px";

    this.createTabNavigation();
    this.createContentContainer();

    this.modalContent.appendChild(this.tabContainer);
    this.modalContent.appendChild(this.contentContainer);

    this.modalCloseButton = createButton({
      value: "Close",
      size: "mini",
      onclick: () => {
        this.modal.style.display = "none";
      },
    });

    const modalButtonContainer = document.createElement("div");
    modalButtonContainer.classList.add("button-container");
    modalButtonContainer.style.justifyContent = "center";
    modalButtonContainer.appendChild(this.modalCloseButton);

    this.modal.appendChild(this.modalTitle);
    this.modal.appendChild(this.modalContent);
    this.modal.appendChild(modalButtonContainer);
  }

  private createTabNavigation() {
    this.tabContainer = document.createElement("div");
    this.tabContainer.style.cssText = `
			width: 150px;
      display: flex;
      flex-direction: column;
      gap: 12px;
			background: rgba(0, 0, 0, 0.3);
			border-radius: 8px;
			padding: 12px;
			overflow-y: auto;
		`;
  }

  private createContentContainer() {
    this.contentContainer = document.createElement("div");
    this.contentContainer.style.cssText = `
			flex: 1;
			padding: 12px;
			overflow-y: auto;
		`;
  }

  private createTabButton(name: string): HTMLButtonElement {
    return createButton({
      value: name,
      size: "mini",
      variant: this.currentTab === name ? "primary" : "secondary",
      style: {
        width: "100%",
        textAlign: "left",
        border: "none",
        color: "#fcfcfc",
        textOverflow: "ellipsis",
        overflow: "hidden",
      },
      onclick: () => {
        this.switchTab(name);
      },
    });
  }

  private switchTab(tabName: string) {
    this.currentTab = tabName;
    this.updateTabButtons();
    this.updateContentContainer();
  }

  private updateTabButtons() {
    this.tabContainer.innerHTML = "";
    for (const [name] of this.tabs) {
      const button = this.createTabButton(name);
      this.tabContainer.appendChild(button);
    }
  }

  private updateContentContainer() {
    this.contentContainer.innerHTML = "";
    const contentCreator = this.tabs.get(this.currentTab);
    if (contentCreator) {
      const content = contentCreator();
      this.contentContainer.appendChild(content);
    }
  }

  private createTabContentContainer(title: string): HTMLElement {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "12px";

    const header = document.createElement("h3");
    header.textContent = title;
    header.style.color = "#fcfcfc";
    header.style.fontSize = "22px";
    container.appendChild(header);

    return container;
  }

  private createSearchTabContent(): HTMLElement {
    const container = this.createTabContentContainer("Search Settings");

    const enableDryBuyCheckbox = createCheckbox({
      label: "Enable Dry Buy (Simulate purchases without actually buying)",
      checked: this.settingsManager.settings.search.enableDryBuy,
      onchange: (checked) => {
        this.settingsManager.enableDryBuy(checked);
      },
    });

    const enableSoundCheckbox = createCheckbox({
      label: "Enable Sound Notifications",
      checked: this.settingsManager.settings.search.enableSound,
      onchange: (checked) => {
        this.settingsManager.enableSound(checked);
      },
    });

    const currentRandomMinBid = this.settingsManager.getRandomMinBid();

    const randomMinBidControl = createCheckboxInput({
      label: "Random Min Bid Buy",
      checked: currentRandomMinBid.enabled,
      inputValue: currentRandomMinBid.amount.toString(),
      inputPlaceholder: "Enter min amount",
      inputType: "tel",
      inputMin: 0,
      inputMax: 14_999_000,
      onCheckboxChange: (checked) => {
        this.settingsManager.updateRandomMinBid(checked);
      },
      onInputChange: (value) => {
        const amount = parseFloat(value) || 0;
        this.settingsManager.updateRandomMinBid(currentRandomMinBid.enabled, amount);
      },
    });

    const currentRandomMinBuy = this.settingsManager.getRandomMinBuy();

    const randomMinBuyControl = createCheckboxInput({
      label: "Use Random Min Buy",
      checked: currentRandomMinBuy.enabled,
      inputValue: currentRandomMinBuy.amount.toString(),
      inputPlaceholder: "Enter min amount",
      inputType: "tel",
      inputMin: 0,
      inputMax: 15_000_000,
      onCheckboxChange: (checked) => {
        this.settingsManager.updateRandomMinBuy(checked);
      },
      onInputChange: (value) => {
        const amount = parseFloat(value) || 0;
        this.settingsManager.updateRandomMinBuy(currentRandomMinBuy.enabled, amount);
      },
    });

    container.appendChild(enableDryBuyCheckbox.container);
    container.appendChild(enableSoundCheckbox.container);
    container.appendChild(randomMinBidControl.container);
    container.appendChild(randomMinBuyControl.container);

    return container;
  }

  private createSafetyTabContent(): HTMLElement {
    const container = this.createTabContentContainer("Safety Settings");

    const currentDelayBetweenSearches = this.settingsManager.getDelayBetweenSearches();
    const currentEnableCycles = this.settingsManager.getEnableCycles();
    const currentCyclesCount = this.settingsManager.getCyclesCount();
    const currentDelayBetweenCycles = this.settingsManager.getDelayBetweenCycles();

    const delayBetweenSearches = createRangeInput({
      label: "Delay Between Searches (Selected randomly between min and max)",
      minLabel: "Min (seconds)",
      maxLabel: "Max (seconds)",
      minBound: 1,
      defaultMinValue: currentDelayBetweenSearches.min,
      defaultMaxValue: currentDelayBetweenSearches.max,
      onchange: (min, max) => {
        this.settingsManager.updateDelayBetweenSearches(min, max);
      },
    });

    const cyclesCount = createRangeInput({
      label: "Number of Searches per Cycle (Selected randomly between min and max)",
      minLabel: "Min searches",
      maxLabel: "Max searches",
      minBound: 1,
      defaultMinValue: currentCyclesCount.min,
      defaultMaxValue: currentCyclesCount.max,
      onchange: (min, max) => {
        this.settingsManager.updateCyclesCount(min, max);
      },
    });

    const delayBetweenCycles = createRangeInput({
      label: "Delay Between Cycles (Selected randomly between min and max)",
      minLabel: "Min (seconds)",
      maxLabel: "Max (seconds)",
      minBound: 1,
      defaultMinValue: currentDelayBetweenCycles.min,
      defaultMaxValue: currentDelayBetweenCycles.max,
      onchange: (min, max) => {
        this.settingsManager.updateDelayBetweenCycles(min, max);
      },
    });

    const enableCyclesCheckbox = createCheckbox({
      label: "Enable Cycles (Take breaks after a certain number of searches)",
      checked: currentEnableCycles,
      onchange: (checked) => {
        this.settingsManager.enableCycles(checked);
        cyclesCount.setDisabled(!checked);
        delayBetweenCycles.setDisabled(!checked);
      },
    });

    cyclesCount.setDisabled(!currentEnableCycles);
    delayBetweenCycles.setDisabled(!currentEnableCycles);

    container.appendChild(delayBetweenSearches.container);
    container.appendChild(enableCyclesCheckbox.container);
    container.appendChild(cyclesCount.container);
    container.appendChild(delayBetweenCycles.container);

    return container;
  }

  private addTab(name: string, contentCreator: () => HTMLElement) {
    this.tabs.set(name, contentCreator);
    this.updateTabButtons();
    if (this.currentTab === name) {
      this.updateContentContainer();
    }
  }

  constructor(
    private settingsManager: SettingsManager
  ) {
    this.createModal();
    this.addTab("Search", () => this.createSearchTabContent());
    this.addTab("Safety", () => this.createSafetyTabContent());
  }

  get settings() {
    return this.settingsManager.settings;
  }

  init = (container: HTMLElement) => {
    container.appendChild(this.modal);
  };

  showSettings = () => {
    this.modal.style.display = "flex";
    this.updateTabButtons();
    this.updateContentContainer();
  };
}

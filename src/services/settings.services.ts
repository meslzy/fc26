import { createButton } from "~/components/button";
import {
  createCheckbox,
  createCheckboxInput,
  createInput,
  createRangeInput,
} from "~/components/form";

export class SettingsService {
  private modal: HTMLElement;
  private modalTitle: HTMLHeadingElement;
  private modalContent: HTMLElement;
  private modalCloseButton: HTMLButtonElement;
  private tabContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private currentTab: string = "Safety";
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

  private createSafetyTabContent(): HTMLElement {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "12px";

    const title = document.createElement("h3");
    title.textContent = "Safety Settings";
    title.style.color = "#fcfcfc";
    title.style.fontSize = "16px";
    container.appendChild(title);

    const delayInput = createInput({
      label: "Delay Between Search",
      type: "tel",
      value: "1000",
      placeholder: "Enter delay in milliseconds",
      min: 100,
      max: 10000,
      onchange: (value) => {
        console.log("Delay changed:", value);
      },
    });

    container.appendChild(delayInput.container);

    const enableCheckbox = createCheckbox({
      label: "Enable Safety Mode",
      checked: true,
      onchange: (checked) => {
        console.log("Safety mode:", checked);
      },
    });

    container.appendChild(enableCheckbox.container);

    const priceRange = createRangeInput({
      label: "Price Range",
      minValue: 1000,
      maxValue: 50000,
      minLabel: "Min Price",
      maxLabel: "Max Price",
      onMinChange: (value) => {
        console.log("Min price changed:", value);
      },
      onMaxChange: (value) => {
        console.log("Max price changed:", value);
      },
    });

    container.appendChild(priceRange.container);

    const stopSearchControl = createCheckboxInput({
      label: "Stop Search After",
      checked: false,
      inputValue: "100",
      inputPlaceholder: "Enter number of searches",
      inputType: "tel",
      inputMin: 1,
      inputMax: 1000,
      onCheckboxChange: (checked) => console.log("Stop enabled:", checked),
      onInputChange: (value) => console.log("Stop after:", value)
    });

    container.appendChild(stopSearchControl.container);

    return container;
  }

  addTab(name: string, contentCreator: () => HTMLElement) {
    this.tabs.set(name, contentCreator);
    this.updateTabButtons();
    if (this.currentTab === name) {
      this.updateContentContainer();
    }
  }

  constructor() {
    this.createModal();
    this.addTab("Safety", () => this.createSafetyTabContent());
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

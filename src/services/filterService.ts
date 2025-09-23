import { createButton, createStaticButton } from "~/components/button";
import { SearchBucket } from "~/types/fc";

export class FilterService {
  private buttonContainer: HTMLElement;
  private saveFilterButton: HTMLButtonElement;
  private manageFiltersButton: HTMLButtonElement;
  private selectedFiltersButton: HTMLButtonElement;

  private modal: HTMLElement;
  private modalTitle: HTMLHeadingElement;
  private modalContent: HTMLElement;
  private modalCloseButton: HTMLButtonElement;

  private currentBucket: SearchBucket = SearchBucket.PLAYER;

  private createbuttonContainer() {
    this.buttonContainer = document.createElement("div");
    this.buttonContainer.classList.add("button-container");
    this.buttonContainer.style.paddingTop = "10px";
    this.buttonContainer.style.paddingBottom = "10px";

    this.manageFiltersButton = createButton({
      value: "Manage Filters",
      size: "mini",
      onclick: () => {
        this.modal.style.display = "flex";
      },
    });

    this.saveFilterButton = createButton({
      value: "Save Filter",
      size: "mini",
      variant: "primary",
      onclick: () => { },
    });

    this.selectedFiltersButton = createStaticButton({
      value: "Selected (0)",
      size: "mini",
      style: {
        flex: "unset",
      },
    });

    this.buttonContainer.appendChild(this.manageFiltersButton);
    this.buttonContainer.appendChild(this.saveFilterButton);
    this.buttonContainer.appendChild(this.selectedFiltersButton);
  }

  private createModal() {
    this.modal = document.createElement("div");
    this.modal.classList.add("modal");
    this.modal.style.display = "none";
    this.modal.style.flexDirection = "column";
    this.modal.style.gap = "10px";
    this.modal.style.position = "absolute";
    this.modal.style.padding = "10px";
    this.modal.style.zIndex = "1000";
    this.modal.style.inset = "0";
    this.modal.style.overflow = "hidden";
    this.modal.style.backgroundColor = "rgb(32 31 38 / 95%)";

    this.modalTitle = document.createElement("h2");
    this.modalTitle.innerText = "Manage Filters";
    this.modalTitle.style.color = "#fcfcfc";
    this.modalTitle.style.textAlign = "center";

    this.modalContent = document.createElement("div");
    this.modalContent.style.flex = "1";
    this.modalContent.style.backgroundColor = "#2a2933";
    this.modalContent.style.borderRadius = "8px";
    this.modalContent.style.padding = "10px";
    this.modalContent.style.overflowY = "auto";

    this.modalCloseButton = createButton({
      value: "Close",
      size: "mini",
      onclick: () => {
        this.modal.style.display = "none";
      },
    });

    this.modal.appendChild(this.modalTitle);
    this.modal.appendChild(this.modalContent);
    this.modal.appendChild(this.modalCloseButton);
  }

  constructor() {
    this.createbuttonContainer();
    this.createModal();
  }

  onSearchBucket = (bucket: SearchBucket) => {
    this.currentBucket = bucket;
  };

  init = (container: HTMLElement) => {
    container.appendChild(this.buttonContainer);
    container.appendChild(this.modal);
  };
}

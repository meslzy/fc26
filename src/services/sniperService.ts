import { createButton } from "~/components/button";

export class SniperService {
  private buttonContainer: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private settingsButton: HTMLButtonElement;

  onSettingsClick: () => void;

  private createButtonContainer() {
    this.buttonContainer = document.createElement("div");
    this.buttonContainer.classList.add("button-container");
    this.buttonContainer.style.borderRadius = "16px";

    this.stopButton = createButton({
      value: "Stop",
      size: "mini",
      variant: "danger",
      onclick: () => {
      },
    });

    this.startButton = createButton({
      value: "Start",
      size: "mini",
      variant: "primary",
      onclick: () => {
      },
    });

    this.settingsButton = createButton({
      value: "Settings",
      size: "mini",
      style: {
        flex: "none",
      },
      onclick: () => {
        this.onSettingsClick?.();
      },
    });

    this.buttonContainer.appendChild(this.stopButton);
    this.buttonContainer.appendChild(this.startButton);
    this.buttonContainer.appendChild(this.settingsButton);
  }

  constructor() {
    this.createButtonContainer();
  }

  init = (container: HTMLElement) => {
    container.appendChild(this.buttonContainer);
  };
}

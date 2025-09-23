export class PanelService {
  private element: HTMLElement;

  constructor() {
    this.element = document.createElement("div");
    this.element.classList.add("ut-content");
    this.element.style.flex = "1";
    this.element.style.maxWidth = "none";
    this.element.style.maxHeight = "90%";
  }

  init = (container: HTMLElement) => {
    container.appendChild(this.element);
  }
}

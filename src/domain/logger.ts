export class Logger {
  private logContainer: HTMLElement | null = null;
  private logContent: HTMLElement | null = null;

  createLogContainer(parentElement: HTMLElement) {
    if (this.logContainer) return;

    this.logContainer = document.createElement("div");
    this.logContainer.id = "sniperLogs";
    this.logContainer.style.cssText = `
			flex: 1;
			background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
			border: 2px solid #00ff88;
			border-radius: 8px;
			box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
			font-family: 'Courier New', monospace;
			overflow: hidden;
			position: relative;
		`;

    const header = document.createElement("div");
    header.style.cssText = `
			background: #00ff88;
			color: #000;
			padding: 8px 12px;
			font-weight: bold;
			font-size: 14px;
			border-bottom: 1px solid #00ff88;
		`;
    header.textContent = "🎯 SNIPER LOGS";

    this.logContent = document.createElement("div");
    this.logContent.style.cssText = `
			height: calc(100% - 35px);
			overflow-y: auto;
			padding: 10px;
			color: #00ff88;
			font-size: 12px;
			line-height: 1.4;
		`;

    this.logContainer.appendChild(header);
    this.logContainer.appendChild(this.logContent);

    parentElement.style.display = "flex";
    parentElement.appendChild(this.logContainer);

    this.addLog("🚀 Sniper Logger Initialized", "system");
  }

  repositionLogContainer(parentElement?: HTMLElement) {
    if (!this.logContainer) return;

    const parent = parentElement || this.logContainer.parentElement;
    if (!parent) return;

    parent.removeChild(this.logContainer);
    parent.appendChild(this.logContainer);
  }

  addLog(
    message: string,
    type: "info" | "success" | "error" | "system" = "info",
  ) {
    if (!this.logContent) return;

    const timestamp = new Date().toLocaleTimeString();

    const logEntry = document.createElement("div");
    logEntry.style.cssText = `
			margin-bottom: 5px;
			padding: 5px 8px;
			border-radius: 4px;
			opacity: 0;
			transform: translateX(-20px);
			transition: all 0.3s ease;
			border-left: 3px solid ${this.getLogColor(type)};
			background: rgba(0, 255, 136, 0.05);
		`;

    const icon = this.getLogIcon(type);
    logEntry.innerHTML = `
			<span style="color: #666; font-size: 10px;">[${timestamp}]</span>
			<span style="color: ${this.getLogColor(type)}; margin: 0 5px;">${icon}</span>
			<span style="color: #fff;">${message}</span>
		`;

    this.logContent.appendChild(logEntry);

    setTimeout(() => {
      logEntry.style.opacity = "1";
      logEntry.style.transform = "translateX(0)";
    }, 10);

    this.logContent.scrollTop = this.logContent.scrollHeight;

    if (this.logContent.children.length > 100) {
      const firstChild = this.logContent.firstChild;

      if (firstChild) {
        this.logContent.removeChild(firstChild);
      }
    }
  }

  private getLogColor(type: string): string {
    switch (type) {
      case "success":
        return "#00ff88";
      case "error":
        return "#ff4444";
      case "system":
        return "#ffa500";
      default:
        return "#00aaff";
    }
  }

  private getLogIcon(type: string): string {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "system":
        return "⚙️";
      default:
        return "ℹ️";
    }
  }

  clearLogs() {
    if (this.logContent) {
      this.logContent.innerHTML = "";
      this.addLog("Logs cleared", "system");
    }
  }
}

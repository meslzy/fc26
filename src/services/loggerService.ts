export type LogType = "info" | "success" | "error" | "system" | "warning";

export class LoggerService {
  private logContainer: HTMLElement;
  private logContent: HTMLElement;

  private createLogContainer() {
    this.logContainer = document.createElement("div");
    this.logContainer.classList.add("ut-pinned-list");
    this.logContainer.style.cssText = `
			background-color: #201f26;
			border-radius: 16px;
			overflow: hidden;
		`;

    this.logContent = document.createElement("div");
    this.logContent.style.cssText = `
			height: calc(100% - 45px);
      overflow-x: hidden;
			overflow-y: auto;
			font-size: 13px;
			line-height: 1.5;
		`;

    this.logContainer.appendChild(this.logContent);

    this.addLog("Logger initialized", "system");
  }

  private getLogColor(type: LogType): string {
    switch (type) {
      case "success":
        return "#00ff88";
      case "error":
        return "#ff4757";
      case "warning":
        return "#ffa502";
      case "system":
        return "#00d4ff";
      default:
        return "#74b9ff";
    }
  }

  private getLogBackground(type: LogType): string {
    switch (type) {
      case "success":
        return "rgba(0, 255, 136, 0.1)";
      case "error":
        return "rgba(255, 71, 87, 0.1)";
      case "warning":
        return "rgba(255, 165, 2, 0.1)";
      case "system":
        return "rgba(0, 212, 255, 0.1)";
      default:
        return "rgba(116, 185, 255, 0.08)";
    }
  }

  private getLogBorder(type: LogType): string {
    switch (type) {
      case "success":
        return "rgba(0, 255, 136, 0.2)";
      case "error":
        return "rgba(255, 71, 87, 0.2)";
      case "warning":
        return "rgba(255, 165, 2, 0.2)";
      case "system":
        return "rgba(0, 212, 255, 0.2)";
      default:
        return "rgba(116, 185, 255, 0.15)";
    }
  }

  private getLogIcon(type: LogType): string {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "system":
        return "⚙️";
      default:
        return "💬";
    }
  }

  constructor() {
    this.createLogContainer();
  }

  init = (container: HTMLElement) => {
    container.appendChild(this.logContainer);
  };

  addLog(message: string, type: LogType = "info") {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const logEntry = document.createElement("div");
    logEntry.style.cssText = `
			margin-bottom: 8px;
			padding: 8px 12px;
			border-radius: 8px;
			opacity: 0;
			transform: translateY(-10px) scale(0.95);
			transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
			border-left: 4px solid ${this.getLogColor(type)};
			background: ${this.getLogBackground(type)};
			backdrop-filter: blur(5px);
			border: 1px solid ${this.getLogBorder(type)};
		`;

    const icon = this.getLogIcon(type);
    logEntry.innerHTML = `
			<span style="color: #888; font-size: 11px; font-family: 'Courier New', monospace;">[${timestamp}]</span>
			<span style="color: ${this.getLogColor(type)}; margin: 0 8px; font-size: 14px;">${icon}</span>
			<span style="color: #fcfcfc; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">${message}</span>
		`;

    this.logContent.appendChild(logEntry);

    setTimeout(() => {
      logEntry.style.opacity = "1";
      logEntry.style.transform = "translateY(0) scale(1)";
    }, 50);

    this.logContent.scrollTop = this.logContent.scrollHeight;
  }

  clearLogs() {
    this.logContent.innerHTML = "";
    this.addLog("Logs cleared", "system");
  }
}

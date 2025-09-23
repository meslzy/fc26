import type { ButtonConfig, ButtonVariant } from "~/types";

export class ButtonFactory {
	static createCustomButton(
		text: string,
		onClick: () => void,
		variant: ButtonVariant = "default",
	): HTMLElement {
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

	static createButtonGroup(buttons: ButtonConfig[]): HTMLElement {
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
}

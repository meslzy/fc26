const style = document.createElement("style");
style.textContent = `
  .secondary {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fcfcfc;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .secondary.hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.2);
  }
  .transparent {
    background-color: transparent;
    color: #fcfcfc;
    border: none;
  }
  .transparent.hover:not(:disabled) {
    background-color: transparent;
  }
  .danger {
    background-color: #d9534f;
    color: #fcfcfc;
    border: none;
  }
  .danger.hover:not(:disabled) {
    background-color: #c9302c;
  }
  .utility {
    background-color: #5cb85c;
    color: #fcfcfc;
    border: none;
  }
  .utility.hover:not(:disabled) {
    background-color: #449d44;
  }
`;
document.head.appendChild(style);

export interface ButtonProps {
	text: string;
	onclick?: () => void;
	style?: Partial<CSSStyleDeclaration>;
	variant?: "primary" | "secondary" | "transparent" | "danger" | "utility";
	size?: "mini";
}

export const createButton = ({ text, onclick, style, variant, size }: ButtonProps) => {
	const button = document.createElement("button");

	button.textContent = text;
	button.classList.add("btn-standard");

	Object.assign(button.style, style);

	if (variant) button.classList.add(variant);
	if (size) button.classList.add(size);

	if (onclick) {
		button.addEventListener("click", onclick);
	}

	return button;
};

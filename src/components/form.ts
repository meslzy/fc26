export interface LabelProps {
	text: string;
	style?: Partial<CSSStyleDeclaration>;
}

export const createLabel = (props: LabelProps) => {
	const { text, style } = props;

	const label = document.createElement("label");
	label.textContent = text;
	label.style.cssText = `
		color: #fcfcfc;
		font-size: 12px;
		font-weight: bold;
		margin-bottom: 6px;
		display: block;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	`;

	Object.assign(label.style, style);

	return label;
};

export interface InputProps {
	label?: string;
	type?: "text" | "tel";
	value?: string;
	placeholder?: string;
	min?: number;
	max?: number;
	onchange?: (value: string) => void;
	style?: Partial<CSSStyleDeclaration>;
}

export const createInput = (props: InputProps) => {
	const { label, type = "text", value = "", placeholder, min, max, onchange, style } = props;

	const container = document.createElement("div");
	container.style.display = "flex";
	container.style.flexDirection = "column";
	container.style.position = "relative";

	if (label) {
		const labelElement = createLabel({ text: label });
		container.appendChild(labelElement);
	}

	const input = document.createElement("input");
	input.type = type;
	input.value = value;
	if (placeholder) input.placeholder = placeholder;
	if (min !== undefined) input.min = min.toString();
	if (max !== undefined) input.max = max.toString();

	input.style.cssText = `
		flex: 1;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid transparent;
		background-color: #2d2c36;
		color: #fcfcfc;
		font-size: 13px;
		outline: none;
		transition: all 0.3s ease;
	`;

	const errorTooltip = document.createElement("div");
	errorTooltip.style.cssText = `
		position: absolute;
		bottom: -25px;
		left: 0;
		background-color: #ff4757;
		color: #fcfcfc;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 11px;
		white-space: nowrap;
		opacity: 0;
		transform: translateY(-5px);
		transition: all 0.3s ease;
		pointer-events: none;
		z-index: 1000;
	`;

	const validateInput = (value: string): string | null => {
		if (type === "tel" && (min !== undefined || max !== undefined)) {
			const numValue = parseFloat(value);
			if (Number.isNaN(numValue) && value.trim() !== "") {
				return "Must be a valid number";
			}
			if (!Number.isNaN(numValue)) {
				if (min !== undefined && numValue < min) {
					return `Must be at least ${min}`;
				}
				if (max !== undefined && numValue > max) {
					return `Must be at most ${max}`;
				}
			}
		}
		return null;
	};

	const showError = (message: string) => {
		errorTooltip.textContent = message;
		errorTooltip.style.opacity = "1";
		errorTooltip.style.transform = "translateY(0)";
		input.style.borderColor = "#ff4757";
	};

	const hideError = () => {
		errorTooltip.style.opacity = "0";
		errorTooltip.style.transform = "translateY(-5px)";
		input.style.borderColor = "transparent";
	};

	input.addEventListener("focus", () => {
		if (!errorTooltip.textContent) {
			input.style.borderColor = "#1fc3c1";
		}
	});

	input.addEventListener("blur", () => {
		const error = validateInput(input.value);
		if (error) {
			showError(error);
		} else {
			hideError();
		}
	});

	input.addEventListener("input", () => {
		const error = validateInput(input.value);
		if (error) {
			showError(error);
		} else {
			hideError();
		}

		if (onchange) {
			onchange(input.value);
		}
	});

	Object.assign(input.style, style);

	container.appendChild(input);
	container.appendChild(errorTooltip);

	return { container, input };
};

export interface CheckboxProps {
	label: string;
	checked?: boolean;
	onchange?: (checked: boolean) => void;
	style?: Partial<CSSStyleDeclaration>;
}

export const createCheckbox = (props: CheckboxProps) => {
	const { label, checked = false, onchange, style } = props;

	const container = document.createElement("div");
	container.style.cssText = `
		display: flex;
		align-items: center;
		margin-bottom: 16px;
		cursor: pointer;
	`;

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = checked;
	checkbox.style.cssText = `
		width: 16px;
		height: 16px;
		margin-right: 8px;
		cursor: pointer;
		accent-color: #1fc3c1;
	`;

	const labelElement = document.createElement("span");
	labelElement.textContent = label;
	labelElement.style.cssText = `
		color: #fcfcfc;
		font-size: 13px;
		cursor: pointer;
		user-select: none;
	`;

	if (onchange) {
		const handleChange = () => onchange(checkbox.checked);
		checkbox.addEventListener("change", handleChange);
		container.addEventListener("click", (e) => {
			if (e.target !== checkbox) {
				checkbox.checked = !checkbox.checked;
				handleChange();
			}
		});
	}

	Object.assign(container.style, style);

	container.appendChild(checkbox);
	container.appendChild(labelElement);

	return { container, checkbox };
};

export interface RangeInputProps {
	label: string;
	minValue?: number;
	maxValue?: number;
	minLabel?: string;
	maxLabel?: string;
	onMinChange?: (value: string) => void;
	onMaxChange?: (value: string) => void;
	style?: Partial<CSSStyleDeclaration>;
}

export const createRangeInput = (props: RangeInputProps) => {
	const {
		label,
		minValue = 0,
		maxValue = 100,
		minLabel = "Min",
		maxLabel = "Max",
		onMinChange,
		onMaxChange,
		style
	} = props;

	const container = document.createElement("div");
	container.style.cssText = `
		margin-bottom: 16px;
	`;

	const labelElement = createLabel({ text: label });
	container.appendChild(labelElement);

	const rangeContainer = document.createElement("div");
	rangeContainer.style.cssText = `
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	`;

	const minInput = createInput({
		label: minLabel,
		type: "tel",
		value: minValue.toString(),
		onchange: onMinChange,
	});

	const maxInput = createInput({
		label: maxLabel,
		type: "tel",
		value: maxValue.toString(),
		onchange: onMaxChange,
	});

	rangeContainer.appendChild(minInput.container);
	rangeContainer.appendChild(maxInput.container);

	Object.assign(container.style, style);

	container.appendChild(rangeContainer);

	return { container, minInput: minInput.input, maxInput: maxInput.input };
};

export interface CheckboxInputProps {
	label: string;
	checked?: boolean;
	inputValue?: string;
	inputPlaceholder?: string;
	inputType?: "text" | "tel";
	inputMin?: number;
	inputMax?: number;
	onCheckboxChange?: (checked: boolean) => void;
	onInputChange?: (value: string) => void;
	style?: Partial<CSSStyleDeclaration>;
}

export const createCheckboxInput = (props: CheckboxInputProps) => {
	const {
		label,
		checked = false,
		inputValue = "",
		inputPlaceholder,
		inputType = "tel",
		inputMin,
		inputMax,
		onCheckboxChange,
		onInputChange,
		style
	} = props;

	const container = document.createElement("div");
	container.style.cssText = `
		display: flex;
		flex-direction: column;
		gap: 8px;
		position: relative;
	`;

	const labelElement = createLabel({ text: label });
	container.appendChild(labelElement);

	const controlsContainer = document.createElement("div");
	controlsContainer.style.cssText = `
		display: flex;
		align-items: center;
		gap: 12px;
	`;

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = checked;
	checkbox.style.cssText = `
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #1fc3c1;
		flex-shrink: 0;
	`;

	const input = document.createElement("input");
	input.type = inputType;
	input.value = inputValue;
	input.disabled = !checked;
	if (inputPlaceholder) input.placeholder = inputPlaceholder;
	if (inputMin !== undefined) input.min = inputMin.toString();
	if (inputMax !== undefined) input.max = inputMax.toString();

	input.style.cssText = `
		flex: 1;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid transparent;
		background-color: ${checked ? "#2d2c36" : "#1a1a1f"};
		color: ${checked ? "#fcfcfc" : "#888"};
		font-size: 13px;
		outline: none;
		transition: all 0.3s ease;
		opacity: ${checked ? "1" : "0.5"};
	`;

	const errorTooltip = document.createElement("div");
	errorTooltip.style.cssText = `
		position: absolute;
		bottom: -25px;
		left: 16px;
		background-color: #ff4757;
		color: #fcfcfc;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 11px;
		white-space: nowrap;
		opacity: 0;
		transform: translateY(-5px);
		transition: all 0.3s ease;
		pointer-events: none;
		z-index: 1000;
	`;

	const validateInput = (value: string): string | null => {
		if (!checkbox.checked) return null;

		if (inputType === "tel" && (inputMin !== undefined || inputMax !== undefined)) {
			const numValue = parseFloat(value);
			if (Number.isNaN(numValue) && value.trim() !== "") {
				return "Must be a valid number";
			}
			if (!Number.isNaN(numValue)) {
				if (inputMin !== undefined && numValue < inputMin) {
					return `Must be at least ${inputMin}`;
				}
				if (inputMax !== undefined && numValue > inputMax) {
					return `Must be at most ${inputMax}`;
				}
			}
		}
		return null;
	};

	const showError = (message: string) => {
		errorTooltip.textContent = message;
		errorTooltip.style.opacity = "1";
		errorTooltip.style.transform = "translateY(0)";
		input.style.borderColor = "#ff4757";
	};

	const hideError = () => {
		errorTooltip.style.opacity = "0";
		errorTooltip.style.transform = "translateY(-5px)";
		if (!input.disabled) {
			input.style.borderColor = "transparent";
		}
	};

	const updateInputState = () => {
		input.disabled = !checkbox.checked;
		input.style.backgroundColor = checkbox.checked ? "#2d2c36" : "#1a1a1f";
		input.style.color = checkbox.checked ? "#fcfcfc" : "#888";
		input.style.opacity = checkbox.checked ? "1" : "0.5";

		if (!checkbox.checked) {
			hideError();
		}
	};

	input.addEventListener("focus", () => {
		if (!input.disabled && !errorTooltip.textContent) {
			input.style.borderColor = "#1fc3c1";
		}
	});

	input.addEventListener("blur", () => {
		if (!input.disabled) {
			const error = validateInput(input.value);
			if (error) {
				showError(error);
			} else {
				hideError();
			}
		}
	});

	input.addEventListener("input", () => {
		if (!input.disabled) {
			const error = validateInput(input.value);
			if (error) {
				showError(error);
			} else {
				hideError();
			}
		}

		if (onInputChange) {
			onInputChange(input.value);
		}
	});

	if (onCheckboxChange) {
		checkbox.addEventListener("change", () => {
			onCheckboxChange(checkbox.checked);
			updateInputState();
		});
	}

	controlsContainer.appendChild(checkbox);
	controlsContainer.appendChild(input);

	Object.assign(container.style, style);

	container.appendChild(controlsContainer);
	container.appendChild(errorTooltip);

	return { container, checkbox, input };
};

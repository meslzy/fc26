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
  .danger {
    background-color: #d9534f;
    color: #fcfcfc;
    border: none;
  }
  .danger.hover:not(:disabled) {
    background-color: #c9302c;
  }
`;
document.head.appendChild(style);

export interface ButtonProps {
  value: string;
  onclick: () => void;
  variant?: "primary" | "danger" | "secondary";
  size?: "mini";
  style?: Partial<CSSStyleDeclaration>;
}

export const createButton = (props: ButtonProps) => {
  const { value, onclick, variant, size, style } = props;

  const button = document.createElement("button");

  button.textContent = value;
  button.classList.add("btn-standard");

  if (size === "mini") button.classList.add("mini");

  if (variant === "primary") button.classList.add("primary");
  if (variant === "secondary") button.classList.add("secondary");
  if (variant === "danger") button.classList.add("danger");

  Object.assign(button.style, style);

  button.addEventListener("mouseenter", () => {
    button.classList.add("hover");
  });

  button.addEventListener("mouseleave", () => {
    button.classList.remove("hover");
  });

  button.addEventListener("click", onclick);

  return button;
};

export interface StaticButtonProps {
  value: string;
  size?: "mini";
  style?: Partial<CSSStyleDeclaration>;
}

export const createStaticButton = (props: StaticButtonProps) => {
  const { value, size, style } = props;

  const button = document.createElement("button");

  button.textContent = value;
  button.style.color = "#fcfcfc";
  button.style.cursor = "default";

  if (size === "mini") button.classList.add("mini");

  Object.assign(button.style, style);

  return button;
};

import type { ComponentChildren, FunctionComponent } from "preact";

export type ButtonVariant = "primary" | "ghost" | "default";

export interface ButtonProps {
  href?: string;
  variant?: ButtonVariant;
  children?: ComponentChildren;
}

export const Button: FunctionComponent<ButtonProps> = (props) => {
  const variant = props.variant ?? "default";
  const content = (
    <>
      <span aria-hidden="true">🌊</span>
      <span>{props.children}</span>
    </>
  );

  if (props.href) {
    return (
      <a class="ui-btn" data-variant={variant} href={props.href}>
        {content}
      </a>
    );
  }

  return (
    <button class="ui-btn" data-variant={variant} type="button">
      {content}
    </button>
  );
};

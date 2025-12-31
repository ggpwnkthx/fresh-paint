import type { ComponentChildren, FunctionComponent } from "preact";

export type ButtonVariant = "primary" | "ghost" | "default";

export interface ButtonProps {
  href?: string;
  variant?: ButtonVariant;
  children?: ComponentChildren;
}

export const Button: FunctionComponent<ButtonProps> = (props) => {
  const variant = props.variant ?? "default";
  if (props.href) {
    return (
      <a class="ui-btn" data-variant={variant} href={props.href}>
        {props.children}
      </a>
    );
  }

  return (
    <button class="ui-btn" data-variant={variant} type="button">
      {props.children}
    </button>
  );
};

export interface CardProps {
  title: string;
  children?: ComponentChildren;
}

export const Card: FunctionComponent<CardProps> = (props) => {
  return (
    <section class="ui-card">
      <h2>{props.title}</h2>
      <div>{props.children}</div>
    </section>
  );
};

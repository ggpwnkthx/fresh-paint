import type { ComponentChildren } from "preact";

export type ButtonVariant = "primary" | "ghost" | "default";
export type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  children?: ComponentChildren;
};

export const Button = ({ href, variant = "default", children }: ButtonProps) =>
  href
    ? <a class="ui-btn" data-variant={variant} href={href}>{children}</a>
    : (
      <button class="ui-btn" data-variant={variant} type="button">
        {children}
      </button>
    );

export type CardProps = { title: string; children?: ComponentChildren };

export const Card = ({ title, children }: CardProps) => (
  <section class="ui-card">
    <h2>{title}</h2>
    <div>{children}</div>
  </section>
);

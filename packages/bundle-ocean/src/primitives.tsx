import type { ComponentChildren } from "preact";

export type ButtonVariant = "primary" | "ghost" | "default";
export type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  children?: ComponentChildren;
};

export const Button = ({ href, variant = "default", children }: ButtonProps) => {
  const content = (
    <>
      <span aria-hidden="true">🌊</span>
      <span>{children}</span>
    </>
  );

  return href
    ? <a class="ui-btn" data-variant={variant} href={href}>{content}</a>
    : <button class="ui-btn" data-variant={variant} type="button">{content}</button>;
};

import type { ComponentChildren } from "preact";

const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export type ButtonVariant = "primary" | "ghost" | "default";
export type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  children?: ComponentChildren;
};

export const Button = ({ href, variant = "default", children }: ButtonProps) => {
  const base = "ui-btn inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-semibold " +
    "transition will-change-transform select-none no-underline " +
    "hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "[font-family:var(--ui-font)]";

  const sharedColors = "text-[color:var(--ui-fg)] border-[color:var(--ui-border)] " +
    "ring-[color:var(--ui-border)] ring-offset-[color:var(--ui-bg)]";

  const variants: Record<ButtonVariant, string> = {
    default: "[background:var(--ui-btn-bg)]",
    ghost: "bg-transparent",
    primary: "[background:var(--ui-btn-primary-bg)] " +
      "border-[color:color-mix(in_oklab,var(--ui-accent),white_30%)]",
  };

  const cls = cx(base, sharedColors, variants[variant]);

  return href
    ? <a class={cls} data-variant={variant} href={href}>{children}</a>
    : <button class={cls} data-variant={variant} type="button">{children}</button>;
};

export type CardProps = { title: string; children?: ComponentChildren };

export const Card = ({ title, children }: CardProps) => (
  <section
    class={cx(
      "ui-card rounded-[var(--ui-radius)] border p-4",
      "border-[color:var(--ui-border)] bg-[color:var(--ui-surface)]",
    )}
  >
    <h2 class="m-0 mb-2 text-lg font-semibold">{title}</h2>
    <div class="text-[color:var(--ui-muted)] leading-6">{children}</div>
  </section>
);

import type { UiRuntime } from "@repo/ui-kit";

export type HeroProps = {
  title: string;
  subtitle: string;
  ui: UiRuntime;
  ctaHref?: string;
  ctaLabel?: string;
};

export const Hero = ({ title, subtitle, ctaHref, ctaLabel = "Get started", ui }: HeroProps) => {
  const Button = ui.registry.primitives.Button;
  return (
    <div class="ui-hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {ctaHref && Button && <Button href={ctaHref} variant="primary">{ctaLabel}</Button>}
    </div>
  );
};

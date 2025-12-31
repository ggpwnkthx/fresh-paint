import type { UiRuntime } from "@repo/ui-kit";

export type HeroProps = {
  title: string;
  subtitle: string;
  ui: UiRuntime;
  ctaHref?: string;
  ctaLabel?: string;
};

export const Hero = ({ title, subtitle }: HeroProps) => (
  <div class="ui-hero">
    <h1>❄️ {title}</h1>
    <p>{subtitle}</p>
    <span class="ui-pill">Stack above base/ocean to override Hero.</span>
  </div>
);

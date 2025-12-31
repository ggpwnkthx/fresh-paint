import type { UiRuntime } from "@ggpwnkthx/fresh-paint";

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
    <span class="ui-pill">Layer above base/ocean to override Hero.</span>
  </div>
);

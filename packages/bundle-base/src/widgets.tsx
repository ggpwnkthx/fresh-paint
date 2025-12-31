import type { FunctionComponent } from "preact";
import type { UiRuntime } from "@repo/ui-kit";

export interface HeroProps {
  title: string;
  subtitle: string;
  ctaHref?: string;
  ctaLabel?: string;
  ui: UiRuntime;
}

export const Hero: FunctionComponent<HeroProps> = (props) => {
  const Button = props.ui.registry.primitives["Button"];

  return (
    <div class="ui-hero">
      <h1>{props.title}</h1>
      <p>{props.subtitle}</p>

      {props.ctaHref && Button
        ? (
          <Button href={props.ctaHref} variant="primary">
            {props.ctaLabel ?? "Get started"}
          </Button>
        )
        : null}
    </div>
  );
};

import type { FunctionComponent } from "preact";
import type { UiRuntime } from "@repo/ui-kit";

export interface HeroProps {
  title: string;
  subtitle: string;
  ui: UiRuntime;
}

export const Hero: FunctionComponent<HeroProps> = (props) => {
  return (
    <div class="ui-hero">
      <h1>❄️ {props.title}</h1>
      <p>{props.subtitle}</p>
      <p class="ui-pill">Tip: stack me above ocean/base to override the Hero widget.</p>
    </div>
  );
};

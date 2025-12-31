import type { ComponentChildren, FunctionComponent } from "npm:preact@^10";
import type { State } from "../lib/state.ts";
import type { LayoutComponentProps } from "@repo/ui-kit";

type LayoutProps = {
  children: ComponentChildren;
  state: State;
};

const FallbackLayout: FunctionComponent<LayoutComponentProps> = ({ children }) => (
  <div style="padding: 24px;">{children}</div>
);

export default function Layout(props: LayoutProps) {
  const ui = props.state.ui;
  const def = ui.registry.layouts[ui.prefs.layout];
  const LayoutImpl = def?.Layout ?? FallbackLayout;

  return <LayoutImpl ui={ui}>{props.children}</LayoutImpl>;
}

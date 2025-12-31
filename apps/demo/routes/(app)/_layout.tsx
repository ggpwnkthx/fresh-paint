import type { LayoutComponentProps } from "@repo/ui-kit";
import { define } from "@/lib/define.ts";

const FallbackLayout = ({ children }: LayoutComponentProps) => (
  <div style="padding: 24px;">{children}</div>
);

export default define.layout((props) => {
  const ui = props.state.ui;
  const def = ui.registry.layouts[ui.prefs.layout];
  const LayoutImpl = def?.Layout ?? FallbackLayout;

  return <LayoutImpl ui={ui}>{props.children}</LayoutImpl>;
});

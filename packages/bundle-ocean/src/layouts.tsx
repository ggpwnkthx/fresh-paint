import type { FunctionComponent } from "preact";
import type { LayoutComponentProps } from "@repo/ui-kit";

export const AppLayout: FunctionComponent<LayoutComponentProps> = ({ children, ui }) => {
  const Button = ui.registry.primitives["Button"];
  return (
    <div class="ui-shell">
      <header class="ui-nav">
        <div class="ui-brand">
          <span>🌊</span>
          <span>Ocean Layer</span>
          <span class="ui-pill">overrides: app layout + primary button</span>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="ui-pill">stack: {ui.prefs.stack.join(" → ")}</span>
          {Button ? <Button href="/" variant="ghost">Home</Button> : null}
        </div>
      </header>
      <main class="ui-main">
        {children}
      </main>
    </div>
  );
};

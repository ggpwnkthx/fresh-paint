import type { FunctionComponent } from "preact";
import type { LayoutComponentProps } from "@repo/ui-kit";

export const AppLayout: FunctionComponent<LayoutComponentProps> = ({ children, ui }) => {
  const Button = ui.registry.primitives["Button"];
  const theme = ui.prefs.theme;
  const layout = ui.prefs.layout;

  return (
    <div class="ui-shell">
      <header class="ui-nav">
        <div class="ui-brand">
          <span>🧩</span>
          <span>Fresh UI Bundles</span>
          <span class="ui-pill">base</span>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="ui-pill">theme: {theme}</span>
          <span class="ui-pill">layout: {layout}</span>
          {Button ? <Button href="/" variant="ghost">Home</Button> : null}
        </div>
      </header>
      <main class="ui-main">
        {children}
        <div class="ui-footnote">
          This layout comes from <code>bundle-base</code>. Later bundles can override it by key.
        </div>
      </main>
    </div>
  );
};

export const MarketingLayout: FunctionComponent<LayoutComponentProps> = ({ children }) => {
  return (
    <div class="ui-shell">
      <main class="ui-main" style="padding-top:36px;">
        {children}
      </main>
    </div>
  );
};

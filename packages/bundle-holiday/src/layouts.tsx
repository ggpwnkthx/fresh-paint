import type { FunctionComponent } from "preact";
import type { LayoutComponentProps } from "@repo/ui-kit";

export const MarketingLayout: FunctionComponent<LayoutComponentProps> = ({ children, ui }) => {
  return (
    <div class="ui-shell">
      <header class="ui-nav">
        <div class="ui-brand">
          <span>🎁</span>
          <span>Holiday Layer</span>
          <span class="ui-pill">theme + marketing layout</span>
        </div>
        <span class="ui-pill">theme: {ui.prefs.theme}</span>
      </header>
      <main class="ui-main" style="padding-top:30px;">
        {children}
      </main>
    </div>
  );
};

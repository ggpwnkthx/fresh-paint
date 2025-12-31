import type { LayoutComponentProps } from "@repo/ui-kit";

export const MarketingLayout = ({ children, ui }: LayoutComponentProps) => (
  <div class="ui-shell">
    <header class="ui-nav">
      <div class="ui-brand">
        <span>🎁</span>
        <span>Holiday Layer</span>
        <span class="ui-pill">holiday</span>
      </div>
      <span class="ui-pill">theme: {ui.prefs.theme}</span>
    </header>
    <main class="ui-main" style="padding-top:30px">{children}</main>
  </div>
);

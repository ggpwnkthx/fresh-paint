import type { LayoutComponentProps } from "@repo/ui-kit";

export const AppLayout = ({ children, ui }: LayoutComponentProps) => {
  const Button = ui.registry.primitives.Button;

  return (
    <div class="ui-shell">
      <header class="ui-nav">
        <div class="ui-brand">
          <span>🌊</span>
          <span>Ocean Layer</span>
          <span class="ui-pill">ocean</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <span class="ui-pill">stack: {ui.prefs.stack.join(" → ")}</span>
          {Button && <Button href="/" variant="ghost">Home</Button>}
        </div>
      </header>
      <main class="ui-main">{children}</main>
    </div>
  );
};

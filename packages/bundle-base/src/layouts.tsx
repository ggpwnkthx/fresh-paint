import type { ComponentChildren } from "preact";
import type { LayoutComponentProps } from "@ggpwnkthx/fresh-paint";

const Pill = ({ children }: { children: ComponentChildren }) => (
  <span class="ui-pill">{children}</span>
);

type ShellProps = {
  header?: ComponentChildren;
  children: ComponentChildren;
  mainStyle?: string;
};

const Shell = ({ header, children, mainStyle }: ShellProps) => (
  <div class="ui-shell">
    {header && <header class="ui-nav">{header}</header>}
    <main class="ui-main" style={mainStyle}>
      {children}
    </main>
  </div>
);

export const AppLayout = ({ children, ui }: LayoutComponentProps) => {
  const Button = ui.registry.primitives.Button;
  const { theme, layout } = ui.prefs;

  return (
    <Shell
      header={
        <>
          <div class="ui-brand">
            <span>🎨</span>
            <span>Fresh Paint</span>
            <Pill>base</Pill>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <Pill>theme: {theme}</Pill>
            <Pill>layout: {layout}</Pill>
            {Button && <Button href="/" variant="ghost">Home</Button>}
          </div>
        </>
      }
    >
      {children}
      <div class="ui-footnote">
        <code>bundle-base</code>
      </div>
    </Shell>
  );
};

export const MarketingLayout = ({ children }: LayoutComponentProps) => (
  <Shell mainStyle="padding-top:36px">{children}</Shell>
);

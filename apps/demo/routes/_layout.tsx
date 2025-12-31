import type { ComponentChildren, FunctionComponent } from "preact";
import { define } from "@/lib/define.ts";
import type { State } from "./_middleware.ts";

type Ui = NonNullable<State["ui"]>;
type LayoutProps = { children: ComponentChildren; ui: Ui };

const Fallback: FunctionComponent<LayoutProps> = ({ children }) => <div class="p-6">{children}
</div>;

export default define.layout(({ state, Component }) => {
  const ui = state.ui!;
  const Layout = (ui.registry.layouts[ui.prefs.layout]?.Layout ?? Fallback) as FunctionComponent<
    LayoutProps
  >;

  return (
    <Layout ui={ui}>
      <Component />
    </Layout>
  );
});

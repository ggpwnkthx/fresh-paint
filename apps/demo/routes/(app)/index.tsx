import type { ComponentChildren, FunctionComponent } from "preact";
import { define } from "@/lib/define.ts";
import { CATALOG } from "@/lib/catalog.ts";
import PreferencesPicker from "./(_islands)/PreferencesPicker.tsx";

type HeroWidget = FunctionComponent<{
  title: string;
  subtitle: string;
  ui: unknown;
  ctaHref?: string;
  ctaLabel?: string;
}>;

type CardPrimitive = FunctionComponent<{ title: string; children?: ComponentChildren }>;

export default define.page((props) => {
  const ui = props.state.ui;

  const themes = Object.values(ui.registry.themes).map((t) => ({ id: t.id, label: t.label }));
  const layouts = Object.values(ui.registry.layouts).map((l) => ({ id: l.id, label: l.label }));

  const Hero = ui.registry.widgets["Hero"] as unknown as HeroWidget | undefined;
  const Card = ui.registry.primitives["Card"] as unknown as CardPrimitive | undefined;

  return (
    <div class="ui-grid">
      <div style="grid-column: span 12;">
        {Hero
          ? (
            <Hero
              ui={ui}
              title="Runtime bundle stacking"
              subtitle="Reorder or disable bundles, swap themes and layouts, and watch the UI change—without code generation."
              ctaHref="https://fresh.deno.dev"
              ctaLabel="Fresh docs"
            />
          )
          : null}
      </div>

      <div style="grid-column: span 12;">
        <PreferencesPicker
          catalog={CATALOG.slice()}
          current={ui.prefs}
          themes={themes}
          layouts={layouts}
        />
      </div>

      <div style="grid-column: span 12;">
        {Card
          ? (
            <Card title="What you’re looking at">
              <p>
                The server merges registries from the selected bundle stack. CSS from each layer is
                included in order, and later layers override earlier ones.
              </p>
              <p>
                Current stack: <b>{ui.prefs.stack.join(" → ")}</b>
              </p>
            </Card>
          )
          : (
            <div class="ui-card">
              <h2>Registry missing Card primitive</h2>
              <p>Add it in a bundle and re-run.</p>
            </div>
          )}
      </div>

      {ui.warnings.length > 0
        ? (
          <div style="grid-column: span 12;">
            <div class="ui-card">
              <h2>Warnings</h2>
              <ul>
                {ui.warnings.map((w, i) => <li key={`${i}:${w}`}>{w}</li>)}
              </ul>
            </div>
          </div>
        )
        : null}
    </div>
  );
});

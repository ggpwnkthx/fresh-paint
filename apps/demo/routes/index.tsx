import type { ComponentChildren, FunctionComponent } from "preact";
import { define } from "@/lib/define.ts";
import PreferencesPicker from "@/islands/PreferencesPicker.tsx";

type HeroProps = {
  title: string;
  subtitle: string;
  ui: unknown;
  ctaHref?: string;
  ctaLabel?: string;
};
type CardProps = { title: string; children?: ComponentChildren };

export default define.page(({ state }) => {
  const ui = state.ui!;
  const col = { gridColumn: "span 12" } as const;

  const Hero = ui.registry.widgets["Hero"] as FunctionComponent<HeroProps> | undefined;
  const Card = ui.registry.primitives["Card"] as FunctionComponent<CardProps> | undefined;

  return (
    <div class="ui-grid">
      <div style={col}>
        {Hero && (
          <Hero
            ui={ui}
            title="Runtime paint layering"
            subtitle="Reorder or disable layers, swap themes and layouts, and watch the UI repaint."
          />
        )}
      </div>

      <div style={col}>
        <PreferencesPicker
          catalog={ui.catalog}
          current={ui.prefs}
          themes={ui.choices.themes}
          layouts={ui.choices.layouts}
        />
      </div>

      <div style={col}>
        {Card
          ? (
            <Card title="What you’re looking at">
              <p>
                The server merges registries from the selected layer stack. CSS from each layer is
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

      {ui.warnings.length > 0 && (
        <div style={col}>
          <div class="ui-card">
            <h2>Warnings</h2>
            <ul>{ui.warnings.map((w, i) => <li key={`${i}:${w}`}>{w}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
});

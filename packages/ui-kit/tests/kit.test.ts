import { assert, assertEquals } from "@std/assert";
import { h } from "preact";
import { createUiKit } from "../src/kit.ts";
import { defineBundle } from "../src/bundle.ts";

Deno.test("UI kit merges registries in stack order (later overrides earlier)", async () => {
  const a = defineBundle({
    id: "a",
    label: "A",
    primitives: { Button: () => h("button", { type: "button" }, "A") },
    layouts: {
      main: { id: "main", label: "Main", Layout: ({ children }) => h("div", null, children) },
    },
    themes: {
      light: { id: "light", label: "Light", css: [{ url: "https://example.com/a.css" }] },
    },
  });

  const b = defineBundle({
    id: "b",
    label: "B",
    primitives: { Button: () => h("button", { type: "button" }, "B") },
    themes: {
      light: { id: "light", label: "Light+", css: [{ url: "https://example.com/b.css" }] },
    },
  });

  const kit = createUiKit({
    catalog: { a: () => Promise.resolve(a), b: () => Promise.resolve(b) },
    defaults: { stack: ["a", "b"], theme: "light", layout: "main" },
    allowFileCss: false,
  });

  const ui = await kit.resolve(new Request("http://localhost/"));
  assertEquals(ui.prefs.stack, ["a", "b"]);
  assertEquals(Object.keys(ui.registry.primitives), ["Button"]);

  const light = ui.registry.themes["light"];
  assert(light);
  assertEquals(light.label, "Light+");

  assertEquals(ui.catalog.map((c) => c.id), ["a", "b"]);
  assertEquals(ui.choices.themes.map((c) => c.id), ["light"]);
});

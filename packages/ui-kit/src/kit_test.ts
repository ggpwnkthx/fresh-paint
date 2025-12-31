import { assert, assertEquals } from "@std/assert";
import { h } from "preact";
import { createUiKit } from "./kit.ts";
import { defineBundle } from "./bundle.ts";
import type { UiBundle } from "./types.ts";

Deno.test("UI kit merges registries in stack order (later overrides earlier)", async () => {
  const a: UiBundle = defineBundle({
    id: "a",
    label: "A",
    primitives: {
      Button: () => h("button", { type: "button" }, "A"),
    },
    layouts: {
      main: {
        id: "main",
        label: "Main",
        Layout: ({ children }) => h("div", null, children),
      },
    },
    themes: {
      light: { id: "light", label: "Light", css: [{ url: "https://example.com/a.css" }] },
    },
  });

  const b: UiBundle = defineBundle({
    id: "b",
    label: "B",
    primitives: {
      Button: () => h("button", { type: "button" }, "B"),
    },
    themes: {
      light: { id: "light", label: "Light+", css: [{ url: "https://example.com/b.css" }] },
    },
  });

  const kit = createUiKit({
    catalog: {
      a: () => Promise.resolve(a),
      b: () => Promise.resolve(b),
    },
    defaults: { stack: ["a", "b"], theme: "light", layout: "main" },
    allowFileCss: false,
  });

  const ui = await kit.resolve(new Request("http://localhost/"));
  assertEquals(ui.prefs.stack, ["a", "b"]);
  assertEquals(Object.keys(ui.registry.primitives), ["Button"]);

  const light = ui.registry.themes["light"];
  assert(light);
  // Button should be from bundle "b"
  assertEquals(light.label, "Light+");
});

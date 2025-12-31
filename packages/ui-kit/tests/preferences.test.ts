import { assert, assertEquals } from "@std/assert";
import { parseUiPreferencesJson } from "../src/preferences.ts";

Deno.test("parseUiPreferencesJson: accepts valid shape", () => {
  const r = parseUiPreferencesJson({ stack: ["a", "b"], theme: "light", layout: "app" });
  assert(r.ok);
  assertEquals(r.value.stack, ["a", "b"]);
});

Deno.test("parseUiPreferencesJson: rejects invalid json", () => {
  const r = parseUiPreferencesJson(null);
  assert(!r.ok);
});

Deno.test("parseUiPreferencesJson: enforces maxStack", () => {
  const r = parseUiPreferencesJson(
    { stack: Array.from({ length: 21 }, (_, i) => String(i)), theme: "t", layout: "l" },
    { maxStack: 20 },
  );
  assert(!r.ok);
  assertEquals(r.error, "Stack too large");
});

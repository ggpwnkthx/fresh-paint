import { defineConfig } from "vite";
import { fresh } from "jsr:@fresh/plugin-vite@1.0.8";
import tailwindcss from "@tailwindcss/vite";
import { fromFileUrl, resolve } from "jsr:@std/path@1.1.4";
import watchWorkspace from "@watcher";

export default defineConfig({
  plugins: [
    fresh({ serverEntry: "./main.tsx" }),
    tailwindcss(),
    watchWorkspace({
      paths: [resolve(fromFileUrl(new URL(".", import.meta.url)), "../../packages/")],
    }),
  ],
});

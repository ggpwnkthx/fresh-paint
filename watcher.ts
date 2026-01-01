import { type Plugin } from "vite";

export default function watchWorkspace(options: {
  paths: readonly string[];
  ignored?: readonly string[];
  fullReload?: boolean;
}): Plugin {
  return {
    name: "watch-workspace",
    apply: "serve",
    configureServer(server) {
      const ignore = ["**/.deno/**", "**/.git/**", "**/node_modules/**"];
      server.watcher.add([...ignore, ...options.paths]);
      if (options.fullReload ?? true) {
        server.watcher.on("change", () => {
          server.ws.send({ type: "full-reload" });
        });
      }
    },
  };
}

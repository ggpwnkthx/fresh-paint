import { type Plugin } from "vite";

export default function watchWorkspace(options: {
  paths: readonly string[];
  fullReload?: boolean;
}): Plugin {
  return {
    name: "watch-workspace",
    apply: "serve",
    configureServer(server) {
      server.watcher.add([...options.paths]);
      if (options.fullReload ?? true) {
        server.watcher.on("change", () => {
          server.ws.send({ type: "full-reload" });
        });
      }
    },
  };
}

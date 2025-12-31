import { App, staticFiles } from "fresh";
import type { State } from "./routes/_middleware.ts";

export const app = new App<State>().use(staticFiles()).fsRoutes();

if (import.meta.main) await app.listen();

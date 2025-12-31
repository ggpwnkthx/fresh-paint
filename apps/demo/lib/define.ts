import { createDefine } from "fresh";
import type { State } from "./state.ts";

// Setup once, import everywhere.
export const define = createDefine<State>();

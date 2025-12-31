import { createDefine } from "fresh";
import { uiKit } from "../lib/ui.ts";
import type { State } from "../lib/state.ts";

const define = createDefine<State>();

export const handler = define.middleware(async (ctx) => {
  ctx.state.ui = await uiKit.resolve(ctx.req);
  return await ctx.next();
});

import { define } from "@/lib/define.ts";
import { uiKit } from "@/lib/ui.ts";

export default define.middleware(async (ctx) => {
  ctx.state.ui = await uiKit.resolve(ctx.req);
  return await ctx.next();
});

import { define } from "@/lib/define.ts";
import { uiKit } from "@/lib/ui.ts";

export const handler = define.handlers({
  GET: (ctx) => uiKit.cssProxy.handle(ctx.req),
});

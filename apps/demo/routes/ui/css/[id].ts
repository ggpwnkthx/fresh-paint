import { uiKit } from "../../../lib/ui.ts";

type Ctx = { req: Request };

export const handler = {
  GET: (ctx: Ctx) => uiKit.cssProxy.handle(ctx.req),
};

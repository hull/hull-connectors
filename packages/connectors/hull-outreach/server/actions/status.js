// @flow
import type { HullContext } from "hull";
import type HullRouter from "../shared/router";

const statusHandler = (router: HullRouter) => (
  ctx: HullContext
): Promise<any> => router.status(ctx);
export default statusHandler;

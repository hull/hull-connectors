// @flow
import type { HullContext, HullStatusResponse } from "hull";
import type HullRouter from "../shared/router";

const statusHandler = (router: HullRouter) => (
  ctx: HullContext
): HullStatusResponse => router.status(ctx);
export default statusHandler;

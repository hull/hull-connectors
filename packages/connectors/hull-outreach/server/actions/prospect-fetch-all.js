// @flow
import type { HullContext } from "hull";
import type HullRouter from "../shared/router";

const prospectFetchAll = (router: HullRouter) => (
  ctx: HullContext
): Promise<any> => router.incomingRequest("prospectFetchAll", ctx);

export default prospectFetchAll;

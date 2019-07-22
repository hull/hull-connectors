// @flow
import type { HullContext } from "hull";
import type HullRouter from "../shared/router";

const accountFetchAll = (router: HullRouter) => (
  ctx: HullContext
): Promise<any> => router.incomingRequest("accountFetchAll", ctx);

export default accountFetchAll;

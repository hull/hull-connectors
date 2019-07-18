// @flow
import type { HullContext } from "hull";
import type HullRouter from "../shared/router";

const fetchAll = (router: HullRouter) => (ctx: HullContext): Promise<*> =>
  router.incomingRequest("fetchAll", ctx);

export default fetchAll;

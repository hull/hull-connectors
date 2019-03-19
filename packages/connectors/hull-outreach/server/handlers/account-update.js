// @flow
import type { HullContext, HullAccountUpdateMessage } from "hull";
import type HullRouter from "../shared/router";

const accountUpdate = (hullRouter: HullRouter) => (ctx: HullContext, messages: Array<HullAccountUpdateMessage>) =>
  hullRouter.outgoingData("account", ctx, messages)

export default accountUpdate;

// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import type HullRouter from "../shared/router";

const userUpdate = (hullRouter: HullRouter) => (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
) => hullRouter.outgoingData("user", ctx, messages);

export default userUpdate;

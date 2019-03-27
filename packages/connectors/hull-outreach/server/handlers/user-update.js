// @flow
import type { HullContext, HullUserUpdateMessage, HullNotificationResponse } from "hull";
import type HullRouter from "../shared/router";

const userUpdate = (hullRouter: HullRouter) => (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): Promise<HullNotificationResponse> => hullRouter.outgoingData("user", ctx, messages);

export default userUpdate;

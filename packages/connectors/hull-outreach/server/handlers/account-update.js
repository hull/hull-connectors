// @flow
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullNotificationResponse
} from "hull";
import type HullRouter from "../shared/router";

const accountUpdate = (hullRouter: HullRouter) => (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
): HullNotificationResponse =>
  hullRouter.outgoingData("account", ctx, messages);

export default accountUpdate;

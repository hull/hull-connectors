// @flow
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import type HullRouter from "../shared/router";

const webhooks = (router: HullRouter) => (
  context: HullContext,
  message: HullIncomingHandlerMessage
) => router.incomingData("webhook", context, message);
export default webhooks;

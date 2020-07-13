/* @flow */
import type {
  HullContext,
  HullNotificationResponse,
  HullAccountUpdateMessage
} from "hull";

const _ = require("lodash");
const PurpleFusionRouter = require("../lib/purple-fusion-router");

export default async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
): HullNotificationResponse => {
  const privateSettings = ctx.connector.private_settings;

  if (
    !_.get(privateSettings, "instance_url") ||
    !_.get(privateSettings, "access_token") ||
    !_.get(privateSettings, "refresh_token")
  ) {
    ctx.client.logger.info("outgoing.job.skip", {
      jobName: "Outgoing Account",
      reason: "Connector is not or not properly authenticated."
    });
    return {
      status: 200,
      data: {
        status: "ok"
      }
    };
  }

  const route = "accountUpdate";
  const router = new PurpleFusionRouter(route);
  try {
    await router.invokeOutgoingRoute(ctx, messages);
    return {
      status: 200,
      data: {
        status: "ok"
      }
    };
  } catch (err) {
    return {
      flow_control: { type: "retry" }
    };
  }
};

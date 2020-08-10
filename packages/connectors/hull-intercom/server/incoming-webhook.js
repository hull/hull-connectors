// @flow

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

const PurpleFusionRouter = require("./purple-fusion-router");

const incomingWebhook = async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const route = "webhooks";

  const router = new PurpleFusionRouter(route);
  router.invokeRoute(ctx, message.body);

  return {
    status: 200,
    data: {
      ok: true
    }
  };
};

module.exports = incomingWebhook;

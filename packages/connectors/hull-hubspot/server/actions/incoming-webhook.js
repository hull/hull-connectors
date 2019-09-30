// @flow

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

const HubspotPurpleFusionRouter = require("../lib/hubspot-purple-fusion-router");

export default async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const route = "incomingWebhooksHandler";

  const router = new HubspotPurpleFusionRouter(route);
  router.invokeRoute(ctx, message.body);

  return {
    status: 200,
    data: {
      ok: true
    }
  };
};

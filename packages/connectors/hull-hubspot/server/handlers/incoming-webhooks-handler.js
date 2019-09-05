// @flow

import type {
  HullContext,
  // HullResponse,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";


import ingest from "../lib/ingest";
import type { Event } from "../types";

const HubspotPurpleFusionRouter = require("../lib/hubspot-purple-fusion-router");

export default async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  /*
  const hubspotEntityId = _.get(message.body[0], "objectId", "");
  const hubspotEventOccurredAt = _.get(message.body[0], "occurredAt", ""); // store on hubspot/deleted_at
  const hubspotChangeFlag = _.get(message.body[0], "changeFlag", ""); // DELETED
   */

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

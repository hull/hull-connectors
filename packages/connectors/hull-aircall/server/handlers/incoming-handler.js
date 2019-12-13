// @flow

import type {
  HullContext,
  // HullResponse,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import ingest from "../lib/ingest";
import type { Event } from "../types";

const handler = async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { metric } = ctx;
  // $FlowFixMe
  const event: Event = message.body;

  metric.increment("ship.service_api.call");
  ingest(ctx, event);

  return {
    status: 200,
    data: {
      ok: true
    }
  };
};
export default handler;

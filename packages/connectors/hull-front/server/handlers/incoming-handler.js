// @flow

import type {
  HullContext,
  // HullResponse,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import ingest from "../lib/ingest";

const handler = async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { metric } = ctx;

  metric.increment("ship.service_api.call");
  ingest(ctx, message.body);

  return {
    status: 200,
    data: {
      ok: true
    }
  };
};
export default handler;

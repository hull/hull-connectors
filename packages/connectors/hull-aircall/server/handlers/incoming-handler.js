// @flow

import _ from "lodash";
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
  const { client, connector, metric } = ctx;
  const { private_settings = {} } = connector;
  const { api_key } = private_settings;

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

/* @flow */

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

import type { PreviewRequest } from "../../types";

import compute from "../lib/compute";

export default async function computeHandler(
  ctx: HullContext,
  { body }: HullIncomingHandlerMessage
): HullExternalResponse {
  const { client, connector } = ctx;

  // let { connector = {} } = req.body;
  if (!body || typeof body !== "object") {
    return {
      status: 500,
      text: "Invalid Payload, Body must be an object"
    };
  }

  // $FlowFixMe
  const { payload, code }: PreviewRequest = body;

  // This condition ensures boot request does work:
  // When loading the page, the connector is client-side so what's passed to remote
  // doesn't have private_settings embedded
  // connector = connector.private_settings ? connector : req.hull.connector;

  // res.type("application/json");

  if (!client || !connector || !payload) {
    return {
      status: 400,
      data: {
        reason: "missing_params",
        message: "Missing Params"
      }
    };
  }

  const result = await compute({
    context: payload,
    connector,
    client,
    preview: true,
    code
  });

  try {
    const { logs } = result;
    if (logs && logs.length) {
      logs.map(line =>
        client.logger.debug("preview.console.log", { data: line })
      );
    }
    return {
      status: 200,
      data: result
    };
  } catch (error) {
    return {
      status: 500,
      data: { error }
    };
  }
}

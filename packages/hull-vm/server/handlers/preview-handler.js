/* @flow */

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

import compute from "../compute";
import type { PreviewRequest } from "../../types";

export default async function computeHandler(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { client, connector } = ctx;
  const { body } = message;

  // let { connector = {} } = req.body;
  if (!body || typeof body !== "object") {
    return {
      status: 500,
      text: "Invalid Payload, Body must be an object"
    };
  }

  // $FlowFixMe
  const { payload, code, claims, entity, language }: PreviewRequest = body;
  // This condition ensures boot request does work:
  // When loading the page, the connector is client-side so what's passed to remote
  // doesn't have private_settings embedded
  // connector = connector.private_settings ? connector : req.hull.connector;

  // res.type("application/json");

  if (!client || !connector || !payload) {
    return {
      status: 404,
      error: "Missing Params"
    };
  }

  const result = await compute(ctx, {
    source: "processor",
    preview: true,
    entity,
    language,
    claims,
    payload,
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
      error
    };
  }
}

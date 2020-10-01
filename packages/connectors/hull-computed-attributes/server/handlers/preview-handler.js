// @flow

import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

import buildResponse from "../lib/build-response";

export default async function preview(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { body } = message;
  const { client, connector } = ctx;

  if (!body || typeof body !== "object") {
    return {
      status: 500,
      error: "Invalid Payload, Body must be an object"
    };
  }

  const { computedAttributes, payload } = body;
  if (!client || !connector || !payload) {
    return {
      status: 404,
      error: "Missing Params"
    };
  }

  try {
    const { traits, schema } = await buildResponse({
      payload,
      computedAttributes
    });
    return {
      status: 200,
      data: { traits, schema }
    };
  } catch (error) {
    console.log(error);
    return { status: 500, error: error.message };
  }
}

/* @flow */
import type { HullStatusResponse, HullContext } from "hull";

export default async function statusHandler(
  ctx: HullContext
): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings } = connector;
  const { api_key } = private_settings;
  if (!private_settings) {
    return {
      status: "error",
      messages: ["Connector not found"]
    };
  }

  if (!api_key) {
    return {
      status: "error",
      messages: "Missing Credentials: API key is not configured in Settings."
    };
  }

  return {
    status: "ok",
    messages: []
  };
}

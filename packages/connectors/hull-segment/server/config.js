// @flow
import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";
import { parseRequest, fetchToken } from "./lib/fetch-token";

export default function connectorConfig(): HullConnectorConfig {
  const { REDIS_URL } = process.env;

  if (!REDIS_URL) {
    throw new Error("Missing REDIS_URL environment variable");
  }

  return {
    handlers: handlers(),
    middlewares: [/* parseRequest,  */ fetchToken]
  };
}

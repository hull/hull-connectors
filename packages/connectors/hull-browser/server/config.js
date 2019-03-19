// @flow
import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

const {
  SECRET,
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL,
  LOG_LEVEL,
  PORT = 8082,
  REDIS_URL
} = process.env;

if (!REDIS_URL) {
  throw new Error("Missing REDIS_URL environment variable");
}
const hostSecret = SECRET || "1234";
const connectorConfig: HullConnectorConfig = {
  manifest,
  hostSecret,
  devMode: NODE_ENV === "development",
  port: PORT || 8082,
  handlers: handlers({
    redisUri: REDIS_URL
  }),
  middlewares: [],
  logsConfig: {
    logLevel: LOG_LEVEL
  },
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  },
  serverConfig: {
    start: true
  }
};

export default connectorConfig;

// @flow
import type { HullConnectorConfig } from "hull";
import Aws from "aws-sdk";
import { handler } from "hull-sql-importer";

import * as adapters from "./lib/adapters";

export default function connectorConfig(): HullConnectorConfig {
  const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    CONNECTOR_TIMEOUT,
    RUN_TIMEOUT_MS,
    REDIS_TLS_CA
  } = process.env;

  Aws.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  });

  return {
    handlers: handler(adapters),
    timeout: CONNECTOR_TIMEOUT,
    preview_timeout: RUN_TIMEOUT_MS || 60000,
    cacheConfig: {
      tls: { ca: REDIS_TLS_CA }
    },
    queueConfig: {
      settings: { redis: { tls: { ca: REDIS_TLS_CA } } }
    }
  };
}

// @flow

import type { HullConnectorConfig } from "hull";
import Aws from "aws-sdk";
import { handler } from "hull-sql-importer";

// TODO: Implement the DB Adapter in lib/adapter
import * as adapter from "./lib/adapter";

export default function connectorConfig(): HullConnectorConfig {
  const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    CONNECTOR_TIMEOUT,
    RUN_TIMEOUT_MS
  } = process.env;

  Aws.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  });

  return {
    handlers: handler(adapter),
    timeout: CONNECTOR_TIMEOUT,
    preview_timeout: RUN_TIMEOUT_MS || 60000
  };
}

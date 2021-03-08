// @flow
import type { HullConnectorConfig } from "hull";
import Aws from "aws-sdk";
import { handler } from "hull-sql-importer";
import onStatus from "./actions/on-status";
import onAuthorize from "./actions/on-authorize";
import onLogin from "./actions/on-login";
import * as adapter from "./lib/adapter";

const Strategy = require("passport-forcedotcom").Strategy;

export default function connectorConfig(): HullConnectorConfig {
  const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    CONNECTOR_TIMEOUT,
    RUN_TIMEOUT_MS,
    CLIENT_ID,
    CLIENT_SECRET
  } = process.env;

  Aws.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  });

  return {
    handlers: {
      ...handler(adapter),
      private_settings: {
        oauth: () => ({
          onAuthorize,
          onLogin,
          onStatus,
          Strategy,
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        })
      }
    },
    timeout: CONNECTOR_TIMEOUT,
    preview_timeout: RUN_TIMEOUT_MS || 60000
  };
}

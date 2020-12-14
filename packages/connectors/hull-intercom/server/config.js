// @flow

import type { HullConnectorConfig } from "hull";

/*
const webhookHandler = require("hull-connector-framework/src/purplefusion/webhooks/webhook-handler");
const intercomWebhookHandler = require("./incoming-webhook");
*/
const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
  const { CLIENT_ID, CLIENT_SECRET } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find Client ID and/or Client Secret, check env vars"
    );
  }


  return {
      handlers: new HullRouter({
      serviceName: "intercom",
      glue: require("./glue"),
      services: {
        intercom: require("./service")({
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        })
      },
      transforms: _.concat(
        require("./transforms-to-hull"),
        require("./transforms-to-service")
      ),
      ensureHook: "ensure"
    }).createHandler
  };
}

// @flow

import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";
import hubspotWebhookHandler from "./handlers/hubspot-webhook-handler";

export default function connectorConfig(): HullConnectorConfig {
  const { CLIENT_ID, CLIENT_SECRET } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("CLIENT_ID or CLIENT_SECRET variables missing");
  }

  return {
        handlers: handlers({
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    }),
    clientConfig: {
      timeout: 20000,
      cachedCredentials: {
        serviceKey: "body[0].portalId"
      }
    },
    rawCustomRoutes: [
      {
        url: "/hubspot-webhook",
        handler: hubspotWebhookHandler,
        method: "post"
      }
    ]
  };
}

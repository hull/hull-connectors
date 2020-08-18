// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
const webhookHandler = require("hull-connector-framework/src/purplefusion/webhooks/webhook-handler");
const intercomWebhookHandler = require("./incoming-webhook")
const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
  const {
    LOG_LEVEL,
    SECRET,
    PORT = 8082,
    NODE_ENV,
    CLIENT_ID,
    CLIENT_SECRET,
    OVERRIDE_FIREHOSE_URL,
    SHIP_CACHE_TTL = 60,
    REDIS_URL,
    REDIS_MAX_CONNECTIONS = 5,
    REDIS_MIN_CONNECTIONS = 1
  } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Can't find Client ID and/or Client Secret, check env vars"
    );
  }

  const hostSecret = SECRET || "1234";
  
  return {
    manifest,
    handlers: new HullRouter({
      serviceName: "intercom",
      glue: require("./glue"),
      services: { intercom:  require("./service")({
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        })
      },
      transforms: _.concat(
        require("./transforms-to-hull"),
        require("./transforms-to-service")
      ),
      ensureHook: "ensure"
    }).createHandler,
    hostSecret: SECRET || "1234",
    devMode: NODE_ENV === "development",
    port: PORT || 8082,
    cacheConfig: REDIS_URL
      ? {
        store: "redis",
        url: REDIS_URL,
        ttl: SHIP_CACHE_TTL || 180,
        max: REDIS_MAX_CONNECTIONS || 5,
        min: REDIS_MIN_CONNECTIONS || 1
      }
      : undefined,
    middlewares: [],
    serverConfig: {
      start: COMBINED === "true" || SERVER === "true"
    },
    workerConfig: {
      start: COMBINED === "true" || WORKER === "true",
      queueName: QUEUE_NAME || "queue"
    },
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL,
      cachedCredentials: {
        cacheCredentials: true,
        appendCredentials: false,
        credentialsKeyPath: "profile._json.app.id_code",
        serviceKey: "app_id",
        handler: intercomWebhookHandler
      }
    },
    serverConfig: {
      start: true
    },
    queueConfig: REDIS_URL
      ? {
          store: "redis",
          url: REDIS_URL,
          name: KUE_PREFIX
        }
      : { store: "memory" }
    rawCustomRoutes: [
      {
        url: "/webhooks",
        handler: webhookHandler,
        method: "post"
      }
    ]
  };
}

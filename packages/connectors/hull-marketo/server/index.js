/* @flow */
import type { HullRequest } from "hull";

const Aws = require("aws-sdk");

const Hull = require("hull");
const express = require("express");
const redisStore = require("cache-manager-redis");
const { Cache } = require("hull/src/infra");

const _ = require("lodash");

const {
  jsonHandler,
  htmlHandler
} = require("hull/src/handlers");
const {
  HullRouter
} = require("hull-connector-framework/src/purplefusion/router");

const {
  LOG_LEVEL,
  SHIP_CACHE_TTL = 60,
  SHIP_CACHE_MAX = 100,
  REDIS_URL,
  REDIS_MAX_CONNECTIONS = 5,
  REDIS_MIN_CONNECTIONS = 1
} = process.env;

if (LOG_LEVEL) {
  Hull.Client.logger.transports.console.level = LOG_LEVEL;
}

Aws.config.update({
  accessKeyId: process.env.AWS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

// Hull.logger.transports.console.json = true;

let cache;
if (REDIS_URL) {
  cache = new Cache({
    store: redisStore,
    url: REDIS_URL,
    ttl: SHIP_CACHE_TTL,
    max: REDIS_MAX_CONNECTIONS,
    min: REDIS_MIN_CONNECTIONS
  });
} else {
  cache = new Cache({
    store: "memory",
    max: SHIP_CACHE_MAX,
    ttl: SHIP_CACHE_TTL
  });
}

const options = {
  cache,
  hostSecret: process.env.SECRET || "BOOM",
  port: process.env.PORT || 8082,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
};

const app = express();
const connector = new Hull.Connector(options);

connector.setupApp(app);

const hullRouter: HullRouter = new HullRouter({
  glue: require("./glue"),
  manifest: require("../manifest.json"),
  serviceDefinitions: { marketo: require("./service") },
  transforms: _.concat([], require("./transforms-to-hull"), require("./transforms-to-service")),
  ensureHook: "ensureSetup"
});

hullRouter.provisionServer(app);

app.post(
  "/fetchAllLeads",
  jsonHandler({
    callback: (req: HullRequest): Promise<any> => {
      return hullRouter.incomingRequest("fetchAllLeads", req);
    },
    options: {
      fireAndForget: true
    }
  })
);

app.post(
  "/customPollLeadExport",
  jsonHandler({
    callback: (req: HullRequest): Promise<any> => {
      return hullRouter.incomingRequest("customPollLeadExport", req);
    },
    // not sure if we want this, but could be a lot of activity
    options: {
      fireAndForget: true
    }
  })
);

app.get(
  "/admin",
  htmlHandler({
    callback: (req: HullRequest): Promise<any> => {
      if (_.get(req, "connector.private_settings.access_token")) {
        return Promise.resolve({ pageLocation: "home.html"});
      }
      return Promise.resolve({ pageLocation: "login.html"});
    }
  })
);

connector.startApp(app);

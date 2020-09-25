// @flow

import type { Middleware } from "express";

const { compose } = require("compose-middleware");
const credentialsFromQueryMiddleware = require("./credentials-from-query");
// const credentialsFromNotificationMiddleware = require("./credentials-from-notification");
// const instrumentationContextMiddleware = require("./instrumentation-context");
const clientMiddleware = require("./client-middleware");
const helpersMiddleware = require("./helpers-middleware");
const httpClientMiddleware = require("./httpclient-middleware");
const fullContextFetchMiddleware = require("./full-context-fetch");
// const fullContextBodyMiddleware = require("./full-context-body");

function workerContextMiddleware(): Middleware {
  return compose(
    credentialsFromQueryMiddleware(),
    clientMiddleware(),
    helpersMiddleware(),
    httpClientMiddleware(),
    fullContextFetchMiddleware()
  );
}

module.exports = workerContextMiddleware;

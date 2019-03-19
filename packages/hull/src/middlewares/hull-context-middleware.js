// @flow

import type { Middleware } from "express";
// import type { HullContextMiddlewareParams } from "../types";

const { compose } = require("compose-middleware");
const credentialsFromQueryMiddleware = require("./credentials-from-query");
// const credentialsFromNotificationMiddleware = require("./credentials-from-notification");
// const instrumentationContextMiddleware = require("./instrumentation-context");
const clientMiddleware = require("./client-middleware");
const fullContextFetchMiddleware = require("./full-context-fetch");
// const fullContextBodyMiddleware = require("./full-context-body");

function hullContextMiddleware(): Middleware {
  // params: HullContextMiddlewareParams = {}
  // const { requestName, type = "query" } = params;
  return compose(
    credentialsFromQueryMiddleware(),
    clientMiddleware(),
    fullContextFetchMiddleware()
  );
  //
  // return compose(
  //   type === "query"
  //     ? credentialsFromQueryMiddleware()
  //     : credentialsFromNotificationMiddleware(),
  //   clientMiddleware(),
  //   instrumentationContextMiddleware({
  //     handlerName: requestName
  //   }),
  //   type === "query"
  //     ? fullContextFetchMiddleware({ requestName })
  //     : fullContextBodyMiddleware({ requestName }) // if something is missing at body
  // );
}

module.exports = hullContextMiddleware;

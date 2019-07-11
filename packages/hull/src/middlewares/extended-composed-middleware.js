// @flow
import type { Middleware } from "express";
import _ from "lodash";
import type { HullExtendedMiddlewareParams } from "../types";
import getBodyParser from "../utils/get-body-parser";

import credentialsFromNotificationMiddleware from "./credentials-from-notification";
import credentialsFromQueryMiddleware from "./credentials-from-query";
import clientMiddleware from "./client-middleware";
import fullContextBodyMiddleware from "./full-context-body";
import fullContextFetchMiddleware from "./full-context-fetch";
import timeoutMiddleware from "./timeout";
import haltOnTimedoutMiddleware from "./halt-on-timedout";
import instrumentationContextMiddleware from "./instrumentation-context";
// import instrumentationTransientErrorMiddleware from "./instrumentation-transient-error";
import httpClientMiddleware from "./httpclient-middleware";
import getEntityMiddleware from "./get-entity";
import generateTokensMiddleware from "./generate-tokens-middleware";

const { compose } = require("compose-middleware");
// const requestDebugLogging = require("./request-debug-logging");

function extendedComposeMiddleware({
  requestName,
  handlerName,
  options
}: {
  requestName: string,
  handlerName?: string,
  options: HullExtendedMiddlewareParams
}): Middleware {
  const {
    bodyParser,
    credentialsFromQuery,
    credentialsFromNotification,
    strict
  } = options;
  const middlewares = [
    credentialsFromQuery === true
      ? credentialsFromQueryMiddleware()
      : undefined, // parse config from query
    credentialsFromNotification === true
      ? credentialsFromNotificationMiddleware()
      : undefined, // parse config from body
    generateTokensMiddleware(), // rehydrate Tokens
    bodyParser ? getBodyParser(bodyParser) : undefined,
    clientMiddleware(), // initialize client
    // ---------The middlewares below require presence of req.hull;
    timeoutMiddleware(), // properly handle timeout from connectorConfig
    haltOnTimedoutMiddleware(),
    instrumentationContextMiddleware({ handlerName }),
    fullContextBodyMiddleware({ requestName, strict }),
    // @TODO - can we leave both middlewares active and have the second one gracefully handle this ?
    // @TODO: why wouldn't we strict with the fullContextFetchMiddleware ?
    fullContextFetchMiddleware({ requestName /* , strict */ }),
    httpClientMiddleware(),
    getEntityMiddleware()
  ];
  return compose(..._.compact(middlewares));
}

module.exports = extendedComposeMiddleware;

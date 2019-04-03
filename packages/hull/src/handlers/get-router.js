// @flow
import { Router } from "express";
import type { NextFunction } from "express";
import _ from "lodash";
import type {
  HullRequest,
  HullResponse,
  HullIncomingHandlerOptions
} from "../types";
import getBodyParser from "../utils/get-body-parser";

const debug = require("debug")("hull-connector:router");
const {
  credentialsFromQueryMiddleware,
  credentialsFromNotificationMiddleware,
  clientMiddleware,
  fullContextFetchMiddleware,
  fullContextBodyMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware,
  instrumentationTransientErrorMiddleware
} = require("../middlewares");

export default function getRouter({
  options,
  requestName,
  handlerName,
  errorHandler,
  afterMiddlewares = [],
  beforeMiddlewares = [],
  handler
}: {
  options: HullIncomingHandlerOptions,
  requestName: string,
  handlerName?: string,
  handler?: (req: HullRequest, res: HullResponse, next: NextFunction) => any,
  errorHandler?: (
    err: Error,
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) => any,
  beforeMiddlewares?: Array<?express$Middleware>,
  afterMiddlewares?: Array<?express$Middleware>
}) {
  debug("setting up router", { requestName, handlerName, options });
  const {
    disableErrorHandling,
    bodyParser,
    credentialsFromQuery,
    credentialsFromNotification,
    strict
  } = options;
  const router = Router();

  const loggingMiddleware = counter => (
    req: HullRequest,
    res: $Response,
    next: NextFunction
  ) => {
    debug(`stage ${counter}`, _.pick(req, "headers", "url", "method", "body"));
    next();
  };

  beforeMiddlewares.map(m => m && router.use(m));

  router.use(loggingMiddleware("1"));
  if (credentialsFromQuery) {
    router.use(credentialsFromQueryMiddleware()); // parse config from query
  }
  router.use(loggingMiddleware("2"));

  if (credentialsFromNotification) {
    router.use(credentialsFromNotificationMiddleware()); // parse config from body
  }
  router.use(loggingMiddleware("3"));

  if (bodyParser) {
    const parser = getBodyParser(bodyParser);
    if (parser) {
      router.use(parser);
    }
  }
  router.use(loggingMiddleware("4"));

  router.use(clientMiddleware()); // initialize client
  router.use(loggingMiddleware("5"));

  // ---------The middlewares below require presence of req.hull;

  router.use(timeoutMiddleware()); // properly handle timeout from connectorConfig
  router.use(loggingMiddleware("6"));
  router.use(haltOnTimedoutMiddleware());
  router.use(loggingMiddleware("7"));
  router.use(instrumentationContextMiddleware({ handlerName }));
  router.use(loggingMiddleware("8"));
  router.use(fullContextBodyMiddleware({ requestName, strict }));
  router.use(loggingMiddleware("9"));

  // @TODO - can we leave both middlewares active and have the second one gracefully handle this ?
  // @TODO: why wouldn't we strict with the fullContextFetchMiddleware ?
  router.use(fullContextFetchMiddleware({ requestName /* , strict */ }));
  router.use(loggingMiddleware("10"));

  afterMiddlewares.map(m => m && router.use(m));
  router.use(loggingMiddleware("11"));

  if (handler) {
    router.use(handler);
  }
  router.use(loggingMiddleware("12"));

  // Metrics for Transient Errors
  router.use(instrumentationTransientErrorMiddleware());
  router.use(loggingMiddleware("13"));
  if (errorHandler && disableErrorHandling !== true) {
    router.use(errorHandler);
  }
  return router;
}

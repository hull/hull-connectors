// @flow
import { Router } from "express";
import type { NextFunction } from "express";
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
  method,
  options,
  requestName,
  handlerName,
  errorHandler,
  afterMiddlewares = [],
  beforeMiddlewares = [],
  handler
}: {
  method?: string,
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

  beforeMiddlewares.map(m => m && router.use(m));

  if (credentialsFromQuery) {
    router.use(credentialsFromQueryMiddleware()); // parse config from query
  }

  if (credentialsFromNotification) {
    router.use(credentialsFromNotificationMiddleware()); // parse config from body
  }

  if (bodyParser) {
    const parser = getBodyParser(bodyParser);
    if (parser) {
      router.use(parser);
    }
  }

  router.use(clientMiddleware()); // initialize client

  // ---------The middlewares below require presence of req.hull;

  router.use(timeoutMiddleware()); // properly handle timeout from connectorConfig
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware({ handlerName }));
  router.use(fullContextBodyMiddleware({ requestName, strict }));
  // @TODO - can we leave both middlewares active and have the second one gracefully handle this ?
  // @TODO: why wouldn't we strict with the fullContextFetchMiddleware ?
  router.use(fullContextFetchMiddleware({ requestName /* , strict */ }));

  afterMiddlewares.map(m => m && router.use(m));

  if (handler) {
    router.use(handler);
  }

  // Metrics for Transient Errors
  router.use(instrumentationTransientErrorMiddleware());
  if (errorHandler && disableErrorHandling !== true) {
    router.use(errorHandler);
  }
  return {
    method,
    router
  };
}

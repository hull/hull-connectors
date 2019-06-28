// @flow
import { Router } from "express";
import type { NextFunction } from "express";
import type {
  HullRequest,
  HullResponse,
  HullIncomingHandlerOptions
} from "../types";
import getBodyParser from "../utils/get-body-parser";
import {
  instrumentationTransientErrorMiddleware,
  extendedComposeMiddleware
} from "../middlewares";

const debug = require("debug")("hull-connector:router");

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

  router.use(
    extendedComposeMiddleware({
      options,
      requestName,
      handlerName
    })
  );

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

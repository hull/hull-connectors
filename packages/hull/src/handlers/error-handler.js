// @flow
import type { NextFunction } from "express";
import type {
  HullRequest,
  HullIncomingHandlerOptions,
  HullResponse
} from "../types";
import {
  TransientError,
  ConnectorNotFoundError,
  PaymentRequiredError
} from "../errors";

const debug = require("debug")("hull-connector:error-handler");

function errorHandlerMiddlewareFactory({
  respondWithError
}: HullIncomingHandlerOptions) {
  return function errorHandlerMiddleware(
    err: Error,
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    const { metric } = req.hull;
    // $FlowFixMe
    const { message, status = 500 } = err;
    const errorString = message || err.toString();
    debug("error", errorString, err.constructor.name, { respondWithError });

    // if we have a transient error
    if (err instanceof TransientError) {
      console.log("TransientError");
      res.status(status || 503);
      return res.end("transient-error");
    }
    if (err instanceof ConnectorNotFoundError) {
      console.log("COnnectorNotFound");
      res.status(status || 404);
      return res.end("not-found");
    }
    if (err instanceof PaymentRequiredError) {
      console.log("PaymentRequired");
      res.status(status || 402);
      return res.end("payment-required");
    }

    // How do we want to respond?  With json?
    res.status(status);
    res.json({ error: respondWithError ? errorString : true });
    metric.captureException(err);

    // if we have non transient error
    // pass it to the global error middleware
    return next(err);
  };
}

export default errorHandlerMiddlewareFactory;

// @flow
import type { Middleware, $Response, NextFunction } from "express";
import type { HullRequest } from "hull";

const _ = require("lodash");
const debug = require("debug")("hull-middleware");

module.exports = function requestDebugLoggingFactory(): Middleware {
  return function requestDebugLogging(
    req: HullRequest,
    res: $Response,
    next: NextFunction
  ) {
    debug("incoming request", _.pick(req, "headers", "url", "method", "body"));
    next();
  };
};

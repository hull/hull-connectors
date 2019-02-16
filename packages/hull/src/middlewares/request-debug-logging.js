// @flow
import type { $Response, $Request, Middleware, NextFunction } from "express";

const _ = require("lodash");
const debug = require("debug")("hull-middleware");

module.exports = function requestDebugLoggingFactory(): Middleware {
  return function requestDebugLogging(
    req: $Request,
    res: $Response,
    next: NextFunction
  ) {
    debug("incoming request", _.pick(req, "headers", "url", "method", "body"));
    next();
  };
};

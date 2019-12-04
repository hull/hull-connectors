// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest } from "hull";

const debug = require("debug")("hull-connector:halt-on-timeout");

function haltOnTimedoutMiddlewareFactory() {
  return function haltOnTimedoutMiddleware(
    req: HullRequest,
    res: $Response,
    next: NextFunction
  ) {
    if (!req.timedout) {
      debug("Query Timed out", req.timedout);
      next();
    }
  };
}

module.exports = haltOnTimedoutMiddlewareFactory;

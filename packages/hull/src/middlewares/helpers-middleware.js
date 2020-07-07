// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";

const _ = require("lodash");
const helpers = require("../helpers");
/**
 * This middleware is responsible for setting HullContextBase - the base part of the context.
 */

module.exports = function helpersMiddlewareFactory() {
  return function helpersMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    const { hull } = req;
    // Create and expose a ctx.request() method to perform Helpers, fully instrumented.
    hull.helpers = _.mapValues(helpers, f => f(req.hull));
    next();
  };
};

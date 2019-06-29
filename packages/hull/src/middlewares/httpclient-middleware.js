// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";
import httpClient from "../utils/httpclient";
/**
 * This middleware is responsible for setting HullContextBase - the base part of the context.
 */

module.exports = function httpClientMiddlewareFactory() {
  return function httpClientMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    const { hull } = req;
    // Create and expose a ctx.request() method to perform HTTP Requests, fully instrumented.
    hull.request = httpClient(hull);
    next();
  };
}

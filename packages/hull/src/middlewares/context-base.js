// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullBaseMiddlewareParams,
  HullContextBase,
  HullRequestBase
} from "../types";

/**
 * This middleware is responsible for setting HullContextBase - the base part of the context.
 */

function baseMiddlewareFactory(params: HullBaseMiddlewareParams) {
  return function contextBaseMiddleware(
    req: HullRequestBase,
    res: $Response,
    next: NextFunction
  ) {
    const { instrumentation, queue, cache, connectorConfig, Client } = params;
    const { clientConfig } = connectorConfig;
    const context = {};
    context.hostname = req.hostname || "";
    context.isBatch = false;
    context.options = Object.assign({}, req.query);
    context.clientConfig = clientConfig;
    context.connectorConfig = connectorConfig;
    context.cache = cache.getConnectorCache(context);
    context.metric = instrumentation.getMetric(context);
    context.enqueue = queue.getEnqueue(context);
    context.HullClient = Client;
    req.hull = (context: HullContextBase);
    next();
  };
}

module.exports = baseMiddlewareFactory;

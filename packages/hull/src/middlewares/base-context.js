// @flow
import type { NextFunction } from "express";
import type {
  HullBaseMiddlewareParams,
  HullRequest,
  HullResponse
} from "../types";

/**
 * This middleware is responsible for setting HullContextBase - the base part of the context.
 */

function baseContextMiddlewareFactory({
  instrumentation,
  queue,
  cache,
  connectorConfig,
  Client
}: HullBaseMiddlewareParams) {
  return function baseContextMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    const { clientConfig } = connectorConfig;
    const context = req.hull || {};
    context.hostname = req.hostname || "";
    context.isBatch = false;
    context.options = Object.assign({}, req.query);
    context.clientConfig = clientConfig;
    context.connectorConfig = connectorConfig;
    // Warning, since we're mutating the object, flow is complaining. need to implement in a better way
    // $FlowFixMe
    context.cache = cache.getConnectorCache(context);
    // $FlowFixMe
    context.metric = instrumentation.getMetric(context);
    // $FlowFixMe
    context.enqueue = queue.getEnqueue(context);
    // $FlowFixMe
    context.HullClient = Client;
    // $FlowFixMe
    req.hull = context;
    next();
  };
}

module.exports = baseContextMiddlewareFactory;

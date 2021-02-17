// @flow
import type { Middleware } from "express";
import type { HullBaseMiddlewareParams } from "../types";

const { urlencoded, json } = require("express");
const { compose } = require("compose-middleware");
const requestDebugLogging = require("./request-debug-logging");
const baseContextMiddleware = require("./base-context");

function baseComposedMiddleware(params: HullBaseMiddlewareParams): Middleware {
  const { Client, queue, cache, connectorConfig, instrumentation } = params;
  return compose(
    json(connectorConfig.jsonConfig),
    urlencoded({ limit: "50mb", extended: true }),
    instrumentation.startMiddleware(),
    requestDebugLogging(),
    baseContextMiddleware({
      Client,
      connectorConfig,
      instrumentation,
      queue,
      cache
    })
  );
}

module.exports = baseComposedMiddleware;

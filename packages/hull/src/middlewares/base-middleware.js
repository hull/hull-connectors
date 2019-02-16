// @flow

import type { Middleware } from "express";
import type { HullBaseMiddlewareParams } from "../types";

const { json } = require("express");
const { compose } = require("compose-middleware");
const timeoutMiddleware = require("./timeout");
const requestDebugLogging = require("./request-debug-logging");
const contextBaseMiddleware = require("./context-base");
const haltOnTimedoutMiddleware = require("./halt-on-timedout");

function hullBaseMiddleware(params: HullBaseMiddlewareParams): Middleware {
  const { Client, queue, cache, connectorConfig, instrumentation } = params;
  return compose(
    requestDebugLogging(),
    json(connectorConfig.json || { limit: "10mb" }),
    instrumentation.startMiddleware(),
    haltOnTimedoutMiddleware(),
    contextBaseMiddleware({
      Client,
      connectorConfig,
      instrumentation,
      queue,
      cache
    }),
    timeoutMiddleware()
  );
}

module.exports = hullBaseMiddleware;

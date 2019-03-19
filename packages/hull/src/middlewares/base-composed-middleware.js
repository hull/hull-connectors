// @flow
import type { Middleware } from "express";
import type { HullBaseMiddlewareParams } from "../types";

const { urlencoded, json } = require("express");
const { compose } = require("compose-middleware");
const requestDebugLogging = require("./request-debug-logging");
const baseContextMiddleware = require("./base-context");

function baseComposedMiddleware(params: HullBaseMiddlewareParams): Middleware {
  const { Client, queue, cache, connectorConfig, instrumentation } = params;
  console.log("++++++++++++++COMPOSING")
  return compose(
    json({ limit: "10mb", ...connectorConfig.json }),
    urlencoded({ limit: "10mb", extended: true }),
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

// @flow

import type { Middleware } from "express";
import type { HullContextBaseMiddlewareParams } from "../../../types";

const { compose } = require("compose-middleware");
const contextBaseMiddleware = require("./context-base");
const credentialsFromQueryMiddleware = require("./credentials-from-query");
const clientMiddleware = require("./client");
const timeoutMiddleware = require("./timeout");
const fullContextFetchMiddleware = require("./full-context-fetch");
const haltOnTimedoutMiddleware = require("./halt-on-timedout");

function hullContextMiddleware(
  params: HullContextBaseMiddlewareParams
): Middleware {
  const { requestName } = params;
  return compose(
    contextBaseMiddleware(params),
    credentialsFromQueryMiddleware(),
    clientMiddleware(),
    timeoutMiddleware(),
    fullContextFetchMiddleware({ requestName }), // if something is missing at body
    haltOnTimedoutMiddleware()
  );
}

module.exports = hullContextMiddleware;

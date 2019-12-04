// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";

const debug = require("debug")(
  "hull-connector:clear-connector-cache-middleware"
);

module.exports = function clearConnectorCache(
  req: HullRequest,
  res: HullResponse,
  next: NextFunction
) {
  if (
    req.hull.notification &&
    req.hull.notification.channel === "ship:update"
  ) {
    debug("Invalidating Connector cache");
    req.hull.cache.del("connector");
  }
  next();
};

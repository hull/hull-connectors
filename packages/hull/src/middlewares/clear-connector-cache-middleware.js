// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";

module.exports = function clearConnectorCache(
  req: HullRequest,
  res: HullResponse,
  next: NextFunction
) {
  if (
    req.hull.notification &&
    req.hull.notification.channel === "ship:update"
  ) {
    req.hull.cache.del("connector");
  }
  next();
};

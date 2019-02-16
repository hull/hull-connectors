// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestFull } from "../types";

module.exports = function clearConnectorCache(
  req: HullRequestFull,
  res: $Response,
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

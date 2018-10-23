/* @flow */
import type { HullRequest } from "hull";
import type { $Response, NextFunction } from "express";

function syncOut(req: HullRequest, res: $Response, next: NextFunction) {
  return req.hull.enqueue("syncOut", { recreate: false }).then(next, next);
}

module.exports = syncOut;

/* @flow */
import type { HullRequest } from "hull";
import type { $Response, NextFunction } from "express";

function track(req: HullRequest, res: $Response, next: NextFunction) {
  return req.hull.enqueue("track").then(next, next);
}

module.exports = track;

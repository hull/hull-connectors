/* @flow */
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "hull";

export default function fetchToken(
  req: HullRequest,
  res: HullResponse,
  next: NextFunction
) {
  if (req.query.conf) {
    req.hull = req.hull || {};
    req.hull.clientCredentialsEncryptedToken = req.query.conf.toString();
  }
  next();
}

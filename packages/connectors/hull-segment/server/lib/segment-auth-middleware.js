// @flow

import type { $Request, $Response, NextFunction } from "express";
import type { StatusError } from "../types";

const debug = require("debug")("hull-segment:auth-middleware");
/*
  Parses current request from Segment. Stores the token from req.headers into req.hull.token
*/
module.exports = function authTokenMiddleware(
  req: $Request & { hull: any },
  res: $Response,
  next: NextFunction
) {
  req.hull = req.hull || {};
  const authorization = req.get("Authorization");
  if (authorization) {
    debug("found authorization headers", authorization);
    const [authType, token64] = authorization.split(" ");
    if (authType === "Basic" && token64) {
      try {
        const token = new Buffer.from(token64, "base64")
          .toString()
          .split(":")[0]
          .trim();
        req.hull.clientCredentialsEncryptedToken = token;
        // req.hull.clientCredentials = false;
        debug("wrote token", req.hull.clientCredentialsEncryptedToken);
        return next();
      } catch (err) {
        const e: StatusError = new Error("Invalid Basic Auth Header");
        return next(e);
      }
    }
  }
  const e: StatusError = new Error("No Authorization Headers");
  e.status = 400;
  return next(e);
};

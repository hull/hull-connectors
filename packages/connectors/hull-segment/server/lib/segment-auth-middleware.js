// @flow

import type  { StatusError, HullRequest } from "../types";
import type { $Application, $Request, $Response, NextFunction } from 'express';

const debug = require("debug")("hull-segment:auth-middleware")
/*
  Parses current request from Segment. Stores the token from req.headers into req.hull.token
*/
module.exports = function authTokenMiddleware(
  req: $Request & { hull: any },
  res: $Response,
  next: NextFunction
) {
  req.hull = req.hull || {};
  const authorization = req.get("Authorization")
  if (authorization) {
    debug("found authorization headers", authorization);
    const [authType, token64] = authorization.split(' ');
    if (authType === 'Basic' && token64) {
      try {
        const token = new Buffer(token64, 'base64')
          .toString()
          .split(':')[0]
          .trim();
        req.hull.clientCredentialsToken = token;
        // req.hull.clientCredentials = false;
        debug("wrote token", req.hull.clientCredentialsToken);
      } catch (err) {
        const e: StatusError = new Error('Invalid Basic Auth Header');
        e.status = 401;
        throw e;
        // return next(e);
      }
    }
  }
  return next();
}

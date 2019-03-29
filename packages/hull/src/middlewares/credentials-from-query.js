// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";

const debug = require("debug")("hull-connector:credentials-from-query");
const jwt = require("jwt-simple");

function getToken(query: $PropertyType<HullRequest, "query">): string {
  if (query) {
    if (typeof query.hullToken === "string") {
      return query.hullToken;
    }

    if (typeof query.token === "string") {
      return query.token;
    }

    if (typeof query.state === "string") {
      return query.state;
    }
  }
  return "";
}

function parseQueryString(
  query: $PropertyType<HullRequest, "query">
): { [string]: string | void } {
  return ["organization", "id", "secret", "ship"].reduce((cfg, k) => {
    const val = (query && typeof query[k] === "string" ? query[k] : "").trim();
    if (typeof val === "string") {
      cfg[k] = val;
    } else if (val && val[0] && typeof val[0] === "string") {
      cfg[k] = val[0].trim();
    }
    return cfg;
  }, {});
}

function parseToken(token, secret) {
  if (!token || !secret) {
    return false;
  }
  try {
    const config = jwt.decode(token, secret);
    return config;
  } catch (err) {
    const e = new Error("Invalid Token");
    // e.status = 401;
    throw e;
  }
}

function generateToken(clientCredentials, secret) {
  return jwt.encode(clientCredentials, secret);
}

/**
 * This middleware is responsible for preparing `req.hull.clientCredentials`.
 * If there is already `req.hull.clientCredentials` set before it just skips.
 * Otherwise it tries to parse encrypted token, it search for the token first in `req.hull.clientCredentialsToken`
 * if not available it tries to get the token in `req.query.hullToken`, `req.query.token` or `req.query.state`.
 * If those two steps fails to find information it parse `req.query` looking for direct connector configuration
 */
function credentialsFromQueryMiddlewareFactory() {
  return function credentialsFromQueryMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    try {
      if (!req.hull || !req.hull.connectorConfig) {
        throw new Error(
          "Missing req.hull or req.hull.connectorConfig context object. Did you initialize Hull.Connector() ?"
        );
      }
      const { hostSecret } = req.hull.connectorConfig;
      const clientCredentials =
        req.hull.clientCredentials ||
        parseToken(
          req.hull.clientCredentialsToken || getToken(req.query),
          hostSecret
        ) ||
        parseQueryString(req.query);

      if (clientCredentials === undefined) {
        return next(new Error("Could not resolve clientCredentials"));
      }

      // handle legacy naming
      if (
        // $FlowFixMe
        clientCredentials.ship &&
        typeof clientCredentials.ship === "string"
      ) {
        clientCredentials.id = clientCredentials.ship;
        delete clientCredentials.ship;
        console.warn(
          "You have passed a config parameter called `ship`, which is deprecated. please use `id` instead"
        );
      }

      const clientCredentialsToken = generateToken(
        clientCredentials,
        hostSecret
      );

      debug("resolved configuration", clientCredentials);
      req.hull = Object.assign(req.hull, {
        clientCredentials,
        clientCredentialsToken
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = credentialsFromQueryMiddlewareFactory;

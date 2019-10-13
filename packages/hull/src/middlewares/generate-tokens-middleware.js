// @flow
import type { NextFunction } from "express";
import jwt from "jwt-simple";
import { encrypt } from "../utils/crypto";
import type { HullRequest, HullResponse } from "../types";

const debug = require("debug")("hull-connector:credentials-from-query");

function generateToken(clientCredentials, secret) {
  return jwt.encode(clientCredentials, secret);
}
function generateEncryptedToken(clientCredentials, secret) {
  return encrypt(clientCredentials, secret);
}

/**
 * This middleware is responsible for preparing `req.hull.clientCredentials`.
 * If there is already `req.hull.clientCredentials` set before it just skips.
 * Otherwise it tries to parse encrypted token, it search for the token first in `req.hull.clientCredentialsToken`
 * if not available it tries to get the token in `req.query.hullToken`, `req.query.token` or `req.query.state`.
 * If those two steps fails to find information it parse `req.query` looking for direct connector configuration
 */
function generateTokensMiddlewareFactory() {
  return function generateTokensMiddleware(
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

      // Re-generate tokens based on the actual configuration we ended up using
      const clientCredentialsToken = generateToken(
        req.hull.clientCredentials,
        hostSecret
      );
      const clientCredentialsEncryptedToken = generateEncryptedToken(
        req.hull.clientCredentials,
        hostSecret
      );

      debug(
        "Generated clientCredentialsEncryptedToken & clientCredentialsToken"
      );

      req.hull = Object.assign(req.hull, {
        clientCredentialsToken,
        clientCredentialsEncryptedToken
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = generateTokensMiddlewareFactory;

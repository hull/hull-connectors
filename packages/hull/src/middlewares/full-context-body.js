// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse, HullConnector } from "../types";

const debug = require("debug")("hull-connector:full-context-body-middleware");
const bodyParser = require("body-parser");

const {
  applyConnectorSettingsDefaults,
  trimTraitsPrefixFromConnector
} = require("../utils");

/**
 * This middleware parses request json body and extracts information to fill in full HullContext object.
 */
function fullContextBodyMiddlewareFactory({
  requestName,
  strict = true
}: Object) {
  return function fullContextBodyMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    bodyParser.json({ limit: "10mb" })(req, res, err => {
      if (err !== undefined) {
        return next(err);
      }

      if (
        req.body === null ||
        req.body === undefined ||
        typeof req.body !== "object"
      ) {
        if (strict) {
          return next(new Error("Body must be a json object"));
        }
        return next();
      }
      const { body } = req;

      // @TODO: research how to map unknown data into a shape we expect w/ Flow
      // $FlowFixMe
      const connector: HullConnector = body.connector;
      // pick everything we can
      const {
        segments,
        users_segments,
        accounts_segments,
        account_segments
      } = body;
      if (!req.hull.requestId && body.notification_id) {
        const timestamp = Math.floor(new Date().getTime() / 1000);
        req.hull.requestId = [
          requestName,
          timestamp,
          body.notification_id
        ].join(":");
      }

      const usersSegments = users_segments || segments;
      const accountsSegments = accounts_segments || account_segments;
      debug("read from body %o", {
        connector,
        usersSegments: Array.isArray(usersSegments) && usersSegments.length,
        accountsSegments:
          Array.isArray(accountsSegments) && accountsSegments.length
      });

      if (strict) {
        if (!connector || typeof connector !== "object") {
          return next(new Error("Body is missing connector object"));
        }

        if (!usersSegments || !Array.isArray(usersSegments)) {
          return next(new Error("Body is missing segments array"));
        }

        if (!accountsSegments || !Array.isArray(accountsSegments)) {
          return next(new Error("Body is missing accounts_segments array"));
        }
      }
      applyConnectorSettingsDefaults(connector);
      trimTraitsPrefixFromConnector(connector);

      // $FlowFixMe
      req.hull = Object.assign(req.hull, {
        // $FlowFixMe
        connector,
        // $FlowFixMe
        usersSegments,
        // $FlowFixMe
        accountsSegments,
        // $FlowFixMe
        notification: body
      });
      return next();
    });
  };
}

module.exports = fullContextBodyMiddlewareFactory;

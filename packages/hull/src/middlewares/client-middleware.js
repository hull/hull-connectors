// @flow
import type { NextFunction } from "express";
import HullClient from "hull-client/src";
import type { HullRequest, HullResponse } from "../types";

const _ = require("lodash");
const debug = require("debug")("hull-connector:client-middleware");
const helpers = require("../helpers");

/**
 * This middleware initiates Hull client
 * it depends on `req.hull.clientConfig` parameters available already in the request object.
 * @example
 * const { clientMiddleware } = require("hull/lib/middlewares");
 * const app = express();
 * app.use((req, res, next) => {
 *   // prepare req.hull
 *   req.hull = {
 *     clientConfig: {
 *       id: "connectorId",
 *       secret: "connectorSecret",
 *       organization: "organizationUrl"
 *     }
 *   };
 *   next()
 * });
 * app.use(clientMiddleware());
 * app.post("/endpoint", (req, res) => {
 *   req.hull.client.get("app")
 *     .then(connector => req.end("ok"));
 * });
 */
function clientMiddlewareFactory() {
  return function clientMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    try {
      if (!req.hull) {
        throw new Error(
          "Missing request context, you need to initiate it before. we can't find the `req.hull` object"
        );
      }
      if (!req.hull.connectorConfig || !req.hull.connectorConfig.hostSecret) {
        throw new Error(
          "Missing connectorConfig or connectorConfig.hostSecret"
        );
      }
      if (!req.hull.clientCredentials) {
        throw new Error("Missing clientCredentials");
      }

      const HullClientClass = req.hull.HullClient || HullClient;
      const mergedClientConfig = {
        ...req.hull.clientConfig,
        ...req.hull.clientCredentials,
        requestId: req.hull.requestId
      };

      debug("configuration %o", mergedClientConfig, req.hull.clientCredentials);
      req.hull.client = new HullClientClass(mergedClientConfig);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = clientMiddlewareFactory;

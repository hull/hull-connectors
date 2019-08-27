// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";
import ConnectorNotFoundError from "../errors/connector-not-found";
import PaymentRequiredError from "../errors/payment-required-error";

const debug = require("debug")("hull-connector:full-context-fetch-middleware");

const {
  applyConnectorSettingsDefaults,
  trimTraitsPrefixFromConnector
} = require("../utils");


const getSegments = (ctx, id, entityType) => Promise.resolve(ctx[`${entityType}sSegments`]) || ctx.client.get(
  `/${entityType}s_segments`,
  { shipId: id },
  { timeout: 5000, retry: 1000 }
)
const getConnector = ctx => Promise.resolve(ctx.connector) || ctx.client.get("app", {});


/*
function fetchConnector(ctx, cache): Promise<*> {
  debug("fetchConnector", typeof ctx.connector);
  if (ctx.connector) {
    return Promise.resolve(ctx.connector);
  }
  if (!cache) {
    return ctx.client.get("app", {});
  }
  return ctx.cache.wrap(
    "connector",
    () => {
      debug("fetchConnector - calling API");
      return ctx.client.get("app", {});
    },
    { ttl: 60000 }
  );
}


function fetchSegments(ctx, entityType = "user", cache) {
  debug("fetchSegments", entityType, typeof ctx[`${entityType}sSegments`]);
  if (ctx.client === undefined) {
    return Promise.reject(new Error("Missing client"));
  }
  if (ctx[`${entityType}sSegments`]) {
    return Promise.resolve(ctx[`${entityType}sSegments`]);
  }
  const { id } = ctx.client.configuration();
  if (!cache) {
    return ctx.client.get(
      `/${entityType}s_segments`,
      { shipId: id },
      { timeout: 5000, retry: 1000 }
    );
  }
  return ctx.cache.wrap(
    `${entityType}s_segments`,
    () => {
      if (ctx.client === undefined) {
        return Promise.reject(new Error("Missing client"));
      }
      debug("fetchSegments - calling API");
      return ctx.client.get(
        `/${entityType}s_segments`,
        { shipId: id },
        {
          timeout: 5000,
          retry: 1000
        }
      );
    },
    { ttl: 60000 }
  );
}
*/

/**
 * This middleware is responsible for fetching all information
 * using initiated `req.hull.client`.
 * It's responsible for setting
 * - `req.hull.connector`
 * - `req.hull.usersSegments`
 * - `req.hull.accountsSegments`
 * It also honour existing values at this properties. If they are already set they won't be overwritten.
 */
function fullContextFetchMiddlewareFactory({
  requestName,
  cacheContextFetch = true,
  strict = true
}: Object = {}) {
  return async function fullContextFetchMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    if (req.hull === undefined || req.hull.client === undefined) {
      return next(
        new Error(
          "We need initialized client to fetch connector settings and segments lists"
        )
      );
    }

    try {
      const { id } = ctx.client.configuration();
      const [connector, usersSegments, accountsSegments] = await ctx.cache.wrap(
        "connector"
        "users_segments",
        "accounts_segments",
        () => Promise.all([getConnector(ctx), getSegments(ctx, id, "user"), getSegments(ctx, id, "account")]),
        { ttl: 60000 }
      )
      /*
      const [connector, usersSegments, accountsSegments] = await Promise.all([
        fetchConnector(req.hull, cacheContextFetch),
        fetchSegments(req.hull, "user", cacheContextFetch),
        fetchSegments(req.hull, "account", cacheContextFetch)
      ]);
      */
      debug("received responses %o", {
        connector: typeof connector,
        usersSegments: Array.isArray(usersSegments),
        accountsSegments: Array.isArray(accountsSegments)
      });
      if (strict && typeof connector !== "object") {
        return next(new Error("Unable to fetch connector object"));
      }

      if (strict && !Array.isArray(usersSegments)) {
        return next(new Error("Unable to fetch usersSegments array"));
      }

      if (strict && !Array.isArray(accountsSegments)) {
        return next(new Error("Unable to fetch accountsSegments array"));
      }
      const requestId = [requestName].join("-");

      applyConnectorSettingsDefaults(connector);
      trimTraitsPrefixFromConnector(connector);
      req.hull = Object.assign(req.hull, {
        requestId,
        connector,
        usersSegments,
        accountsSegments
      });
      return next();
    } catch (error) {
      if (error.status === 404) {
        try {
          debug(`Connector not found: ${error.message}`);
        } catch (e2) {
          debug("Error thrown in debug message");
        }
        return next(new ConnectorNotFoundError("Invalid id / secret"));
      }
      if (error.status === 402) {
        try {
          debug(`Organization is disabled: ${error.message}`);
        } catch (e2) {
          debug("Error thrown in debug message");
        }
        return next(new PaymentRequiredError("Organization is disabled"));
      }
      return next(error);
    }
  };
}

module.exports = fullContextFetchMiddlewareFactory;

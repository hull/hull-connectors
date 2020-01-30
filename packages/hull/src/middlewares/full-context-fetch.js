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

async function fetchConnector(ctx, cache): Promise<*> {
  debug("fetchConnector", typeof ctx.connector);
  if (ctx.connector) {
    await ctx.cache.set("connector", ctx.connector);
    return ctx.connector;
  }
  const getConnector = () => ctx.client.get("app", {});
  if (!cache) return getConnector();
  return ctx.cache.wrap(
    "connector",
    () => {
      debug("fetchConnector - calling API");
      return getConnector();
    },
    { ttl: 60000 }
  );
}

async function fetchSegments(ctx, entity = "user", cache) {
  debug("fetchSegments", entity, typeof ctx[`${entity}sSegments`]);
  const entitySegments = `${entity}s_segments`;
  const ctxEntity = `${entity}sSegments`;
  const segments = ctx[ctxEntity];
  if (segments) {
    await ctx.cache.set(entitySegments, segments);
    return segments;
  }
  const { id } = ctx.client.configuration();
  const getSegments = () =>
    ctx.client.get(
      `/${entitySegments}`,
      { shipId: id },
      { timeout: 5000, retry: 1000 }
    );
  if (!cache) return getSegments();
  return ctx.cache.wrap(
    entitySegments,
    () => {
      if (ctx.client === undefined) {
        return Promise.reject(new Error("Missing client"));
      }
      debug("fetchSegments - calling API");
      return getSegments();
    },
    { ttl: 60000 }
  );
}

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
      const ctx = req.hull;
      if (ctx.client === undefined) {
        throw new Error("Missing client");
      }
      const [connector, usersSegments, accountsSegments] = await Promise.all([
        fetchConnector(ctx, cacheContextFetch),
        fetchSegments(ctx, "user", cacheContextFetch),
        fetchSegments(ctx, "account", cacheContextFetch)
      ]);
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

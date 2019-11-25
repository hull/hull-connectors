// @flow

import _ from "lodash";

import type { NextFunction } from "express";
import type { HullRequest, HullResponse, HullGetEntityParams } from "../types";
import { getEntity } from "../utils/get-entity";

import searchEvents from "../utils/get-entity/search-events";
import {
  getEventSchema,
  getUserSchema,
  getSchema,
  getAccountSchema
} from "../utils/get-schemas";

module.exports = function getEntityMiddlewareFactory() {
  return function getEntityMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    const { hull } = req;
    // Create and expose a ctx.entities.() method to access higher-level Hull Data
    hull.entities = {
      // Parameter version
      get: getEntity(hull),
      getSchema: getSchema(hull),
      // Scoped versions
      events: {
        getSchema: getEventSchema(hull),
        get: searchEvents(hull)
      },
      users: {
        getSchema: getUserSchema(hull),
        get: (params: HullGetEntityParams) =>
          getEntity(hull)({ entity: "user", ...params })
      },
      accounts: {
        getSchema: getAccountSchema(hull),
        get: (params: HullGetEntityParams) =>
          getEntity(hull)({ entity: "account", ..._.pick(params, "claims") })
      }
    };
    next();
  };
};

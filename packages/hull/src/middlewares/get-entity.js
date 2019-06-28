// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";
import { searchUser, searchAccount, searchEvents } from "../utils/get-entity";
import {
  getEventSchema,
  getUserSchema,
  getAccountSchema
} from "../utils/get-schemas";

module.exports = function httpClientMiddlewareFactory() {
  return function httpClientMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    const { hull } = req;
    // Create and expose a ctx.entities() method to access higher-level Hull Data
    hull.entities = {
      events: {
        get: searchEvents(hull),
        getSchema: getEventSchema(hull)
      },
      users: {
        get: searchUser(hull),
        getSchema: getUserSchema(hull)
      },
      accounts: {
        get: searchAccount(hull),
        getSchema: getAccountSchema(hull)
      }
    };
    next();
  };
};

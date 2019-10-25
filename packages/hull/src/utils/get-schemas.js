// @flow
// import _ from "lodash";
// import fp from "lodash/fp";
import type { HullContext, HullEntityType } from "../types/index";
// import { formatEvent } from "./format-event";

const EVENTS_ROUTE = "/search/event/bootstrap";
const USERS_ROUTE = "/users/schema";
const ACCOUNTS_ROUTE = "/accounts/schema";
const get = (route: string) => (ctx: HullContext) => () =>
  ctx.cache.wrap(
    route,
    () => ctx.client.get(route, { timeout: 5000, retry: 1000 }),
    { ttl: 60000 }
  );

const schemaMapping = {
  user: USERS_ROUTE,
  account: ACCOUNTS_ROUTE,
  events: EVENTS_ROUTE
};
export const getEventSchema = get(EVENTS_ROUTE);
export const getUserSchema = get(USERS_ROUTE);
export const getAccountSchema = get(ACCOUNTS_ROUTE);
export const getSchema = (ctx: HullContext) => (entity: HullEntityType) =>
  get(schemaMapping[entity])(ctx);

// @flow

import type {
  HullEventSchemaEntry,
  HullAttributeSchemaEntry,
  HullContext,
  HullEntityName
} from "../types/index";

const EVENTS_ROUTE = "/search/event/bootstrap";
const USERS_ROUTE = "/users/schema";
const ACCOUNTS_ROUTE = "/accounts/schema";
const get = (route: string) => (ctx: HullContext) => async () =>
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
export const getEventSchema: HullContext => () => Promise<HullEventSchemaEntry> = get(
  EVENTS_ROUTE
);
export const getUserSchema: HullContext => () => Promise<HullAttributeSchemaEntry> = get(
  USERS_ROUTE
);
export const getAccountSchema: HullContext => () => Promise<HullAttributeSchemaEntry> = get(
  ACCOUNTS_ROUTE
);
export const getSchema = (ctx: HullContext) => (entity: HullEntityName) =>
  get(schemaMapping[entity])(ctx);

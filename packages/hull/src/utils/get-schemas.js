// @flow
import type {
  HullContext,
  HullClaimType,
  HullFetchedUser,
  HullFetchedAccount,
  HullUser,
  HullAccount,
  HullEvent,
  HullSegment,
  HullAccountSegment,
  HullUserSegment,
  HullIncomingHandlerMessage,
  HullExternalResponse,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullIncludedEvents,
  HullIncludedEntities,
  HullEntitySymbol
} from "hull";
import _ from "lodash";
import fp from "lodash/fp";
import { formatEvent } from "./format-event";

const EVENTS_ROUTE = "/search/event/bootstrap";
const USERS_ROUTE = "/users/schema";
const ACCOUNTS_ROUTE = "/accounts/schema";
const get = (route: string) => (ctx: HullContext) =>
  ctx.cache.wrap(
    route,
    () => ctx.client.get(route, { timeout: 5000, retry: 1000 }),
    { ttl: 60000 }
  );
export const getEventSchema = get(EVENTS_ROUTE);
export const getUserSchema = get(USERS_ROUTE);
export const getAccountSchema = get(ACCOUNTS_ROUTE);

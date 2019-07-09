// @flow

import _ from "lodash";
import fp from "lodash/fp";
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
  GetEntityParams,
  HullEntitySymbol
} from "../types/index.js";
import { formatEvent } from "./format-event";
import Queries from "./get-search-query";

const pickSegmentKeys = fp.pick([
  "id",
  "name",
  "type",
  "updated_at",
  "created_at"
]);

const formatSegments = fp.map(pickSegmentKeys);

const getSegmentsFromIds = <T: HullUserSegment | HullAccountSegment>(
  segments: Array<T>,
  ids?: Array<string> = []
): Array<T> => segments.filter(s => _.includes(ids, s.id)).map(pickSegmentKeys);

const getSegmentIds = fp.map("id");

const get = (path: string) => (ctx: HullContext, id: string) =>
  ctx.client.get(`${id}${path}`);

const getUserById = get("/user_report");
const getAccountById = get("/account_report");

const getAccountSegments = async (
  ctx,
  id
): Promise<Array<HullAccountSegment>> => {
  if (!id) return [];
  const segments = await get("/segments")(ctx, id);
  return segments.map(pickSegmentKeys);
};

export const searchEvents = (ctx: HullContext) => async ({
  parent,
  names,
  page = 1,
  per_page = 50
}: HullIncludedEvents & { parent: string }): Promise<Array<HullEvent>> => {
  const query = [{ term: { _parent: parent } }];
  if (_.isArray(names)) {
    query.push({ terms: { event: names } });
  }
  const { data = [] } = await ctx.client.post("search/events", {
    query: { and: query },
    sort: { created_at: "desc" },
    raw: true,
    page,
    per_page
  });
  return data.map(formatEvent);
};

const getEntity = async (
  ctx: HullContext,
  query: {},
  entityType: HullEntitySymbol = "user"
): Promise<HullUser | HullAccount> => {
  const { data = [] } = await ctx.client.post(
    `search/${entityType}_reports`,
    query
  );
  const entity: HullUser | HullAccount = _.omit(data[0], [
    "_id",
    "_type",
    "_index",
    "_score"
  ]);
  if (!entity) {
    throw new Error("User not found");
  }
  return entity;
};

const getAccountPayload = async (
  ctx: HullContext,
  account: HullAccount,
  _include: HullIncludedEntities
): Promise<HullFetchedAccount> => {
  const { segment_ids = [], id } = account;
  if (!id) {
    return {};
  }
  const segments: Array<HullAccountSegment> = getSegmentsFromIds(
    ctx.accountsSegments,
    segment_ids || []
  );

  return {
    account,
    account_segments: segments,
    account_segment_ids: segment_ids || []
  };
};

const getUserPayload = async (
  ctx: HullContext,
  user: HullUser,
  include: HullIncludedEntities
): Promise<HullFetchedUser> => {
  const { id, account = {}, segment_ids = [] } = user;
  const segments: Array<HullUserSegment> = getSegmentsFromIds(
    ctx.usersSegments,
    segment_ids || []
  );

  // const { segment_ids: account_segment_ids } = account;
  const { events: includeEvents, account: includeAccount = true } = include;
  const [events = [], account_segments = []] = await Promise.all([
    includeEvents ? searchEvents(ctx)({ ...includeEvents, parent: id }) : [],
    includeAccount && account.id ? getAccountSegments(ctx, account.id) : []
  ]);
  // TODO: see what else we can HullExternalResponse
  return {
    // message_id: "",
    user,
    segments,
    segment_ids: segment_ids || [],
    ...(includeEvents ? { events } : {}),
    ...(includeAccount
      ? {
          account,
          account_segments,
          account_segment_ids: getSegmentIds(account_segments)
        }
      : {})
  };
};

export const searchEntity = (
  entityType: HullEntitySymbol,
  getPayload: typeof getUserPayload | typeof getAccountPayload
) => (ctx: HullContext) => async ({
  claim,
  claimType,
  service,
  include
}: GetEntityParams): Promise<void | HullFetchedUser | HullFetchedAccount> => {
  const getQuery = Queries[claimType || entityType];
  if (!getQuery) {
    throw new Error("Invalid query type");
  }
  const query = getQuery(claim, service);
  const entity = await getEntity(ctx, query, entityType);
  if (!entity) {
    throw new Error(`Can't find ${entityType}`);
  }
  // return entity;
  return getPayload(ctx, entity, include || {});
};
export const searchUser = searchEntity("user", getUserPayload);
export const searchAccount = searchEntity("account", getAccountPayload);

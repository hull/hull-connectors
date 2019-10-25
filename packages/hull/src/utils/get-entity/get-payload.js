// @flow
import _ from "lodash";
import fp from "lodash/fp";

import type {
  HullContext,
  HullFetchedUser,
  HullFetchedAccount,
  HullUser,
  HullAccount,
  HullAccountSegment,
  HullUserSegment,
  HullIncludedEntities
} from "../../types/index";
import searchEvents from "./search-events";

const pickSegmentKeys = fp.pick([
  "id",
  "name",
  "type",
  "updated_at",
  "created_at"
]);

const getSegmentsFromIds = <T: HullUserSegment | HullAccountSegment>(
  segments: Array<T>,
  ids?: Array<string> = []
): Array<T> => segments.filter(s => _.includes(ids, s.id)).map(pickSegmentKeys);

const get = (path: string) => (ctx: HullContext, id: string) =>
  ctx.client.get(`${id}${path}`);

const getSegmentIds = fp.map("id");

const getAccountSegments = async (
  ctx,
  id
): Promise<Array<HullAccountSegment>> => {
  if (!id) return [];
  const segments = await get("/segments")(ctx, id);
  return segments.map(pickSegmentKeys);
};

export const getAccountPayload = async (
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

  return Promise.resolve({
    account: _.omit(account, "indexed_at", "doctype"),
    account_segments: segments,
    account_segment_ids: segment_ids || []
  });
};

export const getUserPayload = async (
  ctx: HullContext,
  user: HullUser,
  include: HullIncludedEntities = {}
): Promise<HullFetchedUser> => {
  const { id, account = {}, segment_ids = [] } = user;
  const segments: Array<HullUserSegment> = getSegmentsFromIds(
    ctx.usersSegments,
    segment_ids || []
  );

  const { events: includeEvents, account: includeAccount = true } = include;
  const [events = [], account_segments = []] = await Promise.all([
    includeEvents
      ? searchEvents(ctx)({ ...(includeEvents && {}), parent: id })
      : [],
    includeAccount && account.id ? getAccountSegments(ctx, account.id) : []
  ]);
  // TODO: see what else we can HullExternalResponse
  return {
    // message_id: "",
    user: _.omit(user, "account", "indexed_at", "doctype", "segment_ids"),
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

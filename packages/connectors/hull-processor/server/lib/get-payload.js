// @flow
import type {
  HullContext,
  HullUser,
  HullEvent,
  HullSegment,
  HullUserUpdateMessage,
  HullEntityType
} from "hull";
import _ from "lodash";
import { formatEvent, isVisible } from "./format-event";
import getUserSearchQuery from "./get-user-search-query";

const get = (path: string) => (ctx: HullContext, id: string) =>
  ctx.client.get(`${id}${path}`);

const getSegments = async (ctx, id): Promise<Array<HullSegment>> => {
  if (!id) return [];
  const s = await get("/segments")(ctx, id);
  return _.pick(s, "id", "name", "type", "updated_at", "created_at");
};
// const getEvents = get("/events");
// const getUserById = get("/user_report");
// const getAccountById = get("/account_report");

const getEventQuery = id => ({
  query: {
    term: { _parent: id }
  },
  sort: { created_at: "desc" },
  raw: true,
  page: 1,
  per_page: 50
});
const getEvents = async (ctx, id): Promise<Array<HullEvent>> => {
  try {
    const { data } = await ctx.client.post("search/events", getEventQuery(id));
    return data.filter(isVisible).map(formatEvent);
  } catch (err) {
    return [];
  }
};

/*
 * returns a sample set of 3 keys picked at random in the source object to simulate a changes object.
 * We are omitting `account` and `segment_ids` from this preview changes object.
 *
 * @param  {User|Account payload} source a User or Account, flat format (not grouped)
 * @return {Object}        A user change or account change dummy object to simulate one that we would receive with actual notifications
 */
const getSample = source =>
  _.reduce(
    _.sampleSize(_.omit(_.keys(source), "account", "segment_ids"), 3),
    (m, k: string) => {
      m[k] = [null, source[k]];
      m.THOSE_ARE_FOR_PREVIEW_ONLY = [null, "fake_values"];
      return m;
    },
    {}
  );

const getChanges = ({ user, account, segments, account_segments }) => ({
  account: getSample(account),
  user: getSample(user),
  is_new: false,
  segments: {
    entered: [_.first(segments)],
    left: [_.last(segments)]
  },
  account_segments: {
    entered: [_.first(account_segments)],
    left: [_.last(account_segments)]
  }
});

export const getPayload = async (
  ctx: HullContext,
  user: HullUser
): Promise<HullUserUpdateMessage> => {
  const { id, account } = user;
  const [events = [], segments = [], account_segments = []] = await Promise.all(
    [getEvents(ctx, id), getSegments(ctx, id), getSegments(ctx, id)]
  );
  // TODO: see what else we can HullExternalResponse
  return {
    // message_id: "",
    user: ctx.client.utils.traits.group(_.omit(user, "account")),
    account: ctx.client.utils.traits.group(account || {}),
    segments,
    account_segments,
    // account_segment_ids: _.map(account_segments, "id"),
    // segment_ids: _.map(segments, "id"),
    events,
    changes: getChanges({
      user,
      account,
      account_segments,
      segments
    })
  };
};

// export const getById = async (
//   ctx: HullContext,
//   userId: string
// ): Promise<HullUser> => {
//   const user = await getUserById(ctx, userId);
//   if (!user) {
//     throw new Error("User not found");
//   }
//   return user;
// };
export const getEntity = async (
  ctx: HullContext,
  search: string,
  type: HullEntityType = "user"
): Promise<HullUser> => {
  const { data = [] } = await ctx.client.post(
    `search/${type === "account" ? "account" : "user"}_reports`,
    getUserSearchQuery(search)
  );
  const user: HullUser = _.omit(data[0], ["_id", "_type", "_index", "_score"]);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

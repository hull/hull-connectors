// @flow

import _ from "lodash";
import { filterEntityClaims } from "hull-client/src/lib/filter-claims";
import type {
  HullContext,
  HullFetchedUser,
  HullFetchedAccount,
  HullUser,
  HullAccount,
  HullEntityType,
  HullGetEntityParams
} from "../../types/index";
import { getAccountPayload, getUserPayload } from "./get-payload";
import Queries from "./queries";

const getEntities = async (
  ctx: HullContext,
  query: {},
  entity: HullEntityType = "user"
): Promise<Array<HullUser | HullAccount>> => {
  const { data = [] } = await ctx.client.post(
    `search/${entity}_reports`,
    query
  );
  if (!data.length) {
    throw new Error("No entity Found");
  }
  return data
    .filter(d => !!d.id)
    .map(d =>
      _.omit(d, "_id", "_type", "_index", "_score", "indexed_at", "doctype")
    );
};

const USER_LOOKUP = ["id", "external_id", "email", "anonymous_id"];
const ACCOUNT_LOOKUP = ["id", "external_id", "domain", "anonymous_id"];

const search = (ctx: HullContext) => async ({
  claims,
  entity,
  per_page = 1,
  page = 1,
  include
}: HullGetEntityParams): Promise<
  Array<HullFetchedUser | HullFetchedAccount>
> => {
  if (!entity) {
    throw new Error(
      "No entity defined. you need to specify which entity to search for"
    );
  }
  if (!claims) {
    throw new Error("Empty Claims - you need to pass some claims");
  }
  const filteredClaims = filterEntityClaims(entity, claims);
  const claim = _.find(
    entity === "user" ? USER_LOOKUP : ACCOUNT_LOOKUP,
    v => !!filteredClaims[v]
  );
  const value = claim ? filteredClaims[claim] : undefined;
  if (!value) {
    throw new Error("Empty Query, can't fetch");
  }
  const getQuery = (claim && Queries[claim]) || Queries[entity];
  if (!getQuery) {
    throw new Error("Invalid Query Type");
  }
  if (per_page > 50) {
    throw new Error(
      `Can't ask for more than 50 results per page. You asked ${per_page}`
    );
  }
  const query = getQuery(value, { per_page: Math.min(per_page, 50), page });
  try {
    // get entity
    const entities = await getEntities(ctx, query, entity);
    if (!entities || !entities.length) {
      throw new Error(
        `Searching for a ${entity} with ${
          claim ? `${claim}=` : ""
        }${value} returned no result`
      );
    }
    // get rest of attributes to build a notification;
    const responses = await Promise.all(
      entities.map(e =>
        (entity === "user" ? getUserPayload : getAccountPayload)(
          ctx,
          e,
          include
        )
      )
    );
    return responses;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
export default search;

// @flow

import _ from "lodash";
import type {
  HullContext,
  HullGetUserResponse,
  HullGetAccountResponse,
  HullEntityName,
  HullGetEntityParams
} from "../../types/index";
import { getAccountPayload, getUserPayload } from "./get-payload";
import getQuery from "./queries";

const debug = require("debug")("hull-connector:get-entity");

const getEntities = async (
  ctx: HullContext,
  query: {},
  entity: HullEntityName = "user"
): Promise<HullGetUserResponse | HullGetAccountResponse> => {
  debug("getEntities", { query, entity });
  const response = await ctx.client.post(`search/${entity}_reports`, query);
  debug("getEntities response", { query, entity, response });
  const { data = [] } = response;
  if (!data.length) {
    throw new Error("No entity found");
  }
  return {
    ...response,
    data: data
      .filter(d => !!d.id)
      .map(d =>
        _.omit(d, "_id", "_type", "_index", "_score", "indexed_at", "doctype")
      )
  };
};

const isUser = entity => entity === "user";

export const getEntity = (ctx: HullContext) => async ({
  claims,
  search,
  entity,
  per_page = 1,
  page = 1,
  include
}: HullGetEntityParams): Promise<
  HullGetUserResponse | HullGetAccountResponse
> => {
  if (!entity) {
    throw new Error(
      "No entity defined. you need to specify which entity to search for"
    );
  }
  if (!claims && !search) {
    throw new Error(
      "Empty Claims and Search - you need to pass some claims or a search string"
    );
  }

  if (per_page > 50) {
    throw new Error(
      `Can't ask for more than 50 results per page. You asked ${per_page}`
    );
  }
  const query = getQuery({
    claims,
    entity,
    search,
    options: {
      per_page: Math.min(per_page, 50),
      page
    }
  });
  debug("getEntity query", { query });
  if (!query) {
    throw new Error("Invalid Query Type - no Claims and no Search");
  }
  try {
    // get entity
    const entities = await getEntities(ctx, query, entity);
    const { data = [] } = entities;
    const responses = await Promise.all(
      data.map(e =>
        (isUser(entity) ? getUserPayload : getAccountPayload)(ctx, e, include)
      )
    );
    return {
      ...entities,
      data: responses
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};
export default getEntity;

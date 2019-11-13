// @flow

import _ from "lodash";
import type {
  HullContext,
  HullEvent,
  HullIncludedEvents
} from "../../types/index";

import formatEvent from "./format-event";

const searchEvents = (ctx: HullContext) => async ({
  parent,
  names,
  page = 1,
  per_page = 20
}: HullIncludedEvents & { parent: string }): Promise<{
  pagination: {},
  data: Array<HullEvent>
}> => {
  const query = [
    {
      parent_id: {
        type: "user_report",
        id: parent
      }
    }
  ];
  if (per_page > 50) {
    throw new Error(
      `Can't ask for more than 50 events per user. you asked ${per_page}`
    );
  }
  if (_.isArray(names)) {
    query.push({ terms: { event: names } });
  }
  const response = await ctx.client.post("search/events", {
    query: { bool: { filter: query } },
    sort: { created_at: "desc" },
    raw: true,
    page,
    per_page
  });
  return {
    ...response,
    data: (response.data || []).map(formatEvent)
  };
};

export default searchEvents;

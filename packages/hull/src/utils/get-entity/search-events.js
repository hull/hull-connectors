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
}: HullIncludedEvents & { parent: string }): Promise<Array<HullEvent>> => {
  const query = [
    {
      has_parent: {
        parent_type: "user_report",
        query: {
          term: {
            id: parent
          }
        }
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
  const { data = [] } = await ctx.client.post("search/events", {
    query: { bool: { filter: query } },
    sort: { created_at: "desc" },
    raw: true,
    page,
    per_page
  });
  return data.map(formatEvent);
};

export default searchEvents;

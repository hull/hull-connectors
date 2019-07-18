// @flow
import _ from "lodash";
import type { HullContext } from "hull";
import type { EventPreview, Event } from "../types";
import {
  getEventName,
  getEventData,
  getClaims,
  getEventContext
} from "./event-map";

// const omitClaimOptions = traits => traits.map(u => _.omit(u, "claimsOptions"));
export default async function ingest(
  ctx: HullContext,
  eventPreview: EventPreview
) {
  const { _links } = eventPreview;
  const { self } = _links;
  const { connector, client } = ctx;
  const { private_settings } = connector;
  const { api_key } = private_settings;
  const eventLabel = getEventName(eventPreview);
  if (eventLabel !== undefined) {
    // Only for whitelisted events -> Fetch in case the customer didn't activate sending the full payload
    const event: Event = await (_.get(eventPreview, "source.data")
      ? Promise.resolve(eventPreview)
      : ctx.request
          .get(self)
          .set("accept", "json")
          .set(`Authorization: Bearer ${api_key}`));
    const claims = getClaims(event);
    if (claims !== undefined) {
      return client
        .asUser(claims)
        .track(eventLabel, getEventData(event), getEventContext(event));
    }
  }
  return true;
}

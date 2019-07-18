// @flow
import _ from "lodash";
import type { HullContext } from "hull";
import type { Event } from "../types";
import {
  getEventName,
  getAttributes,
  getEventData,
  getClaims,
  getEventContext
} from "./event-map";

export default async function ingest(ctx: HullContext, event: Event) {
  const { connector, client } = ctx;
  const { private_settings } = connector;
  const { /* api_key,  */ preferred_email = "" } = private_settings;
  // const { resource, timestamp, token, data } = event;
  const eventLabel = getEventName(event);
  if (eventLabel === undefined) {
    return;
  }
  const claims = getClaims(preferred_email)(event);
  const attributes = getAttributes(event);
  if (claims) {
    const userScope = client.asUser(claims);
    await Promise.all([
      _.size(attributes) ? userScope.traits(attributes) : Promise.resolve(),
      userScope.track(eventLabel, getEventData(event), getEventContext(event))
    ]);
  }
}

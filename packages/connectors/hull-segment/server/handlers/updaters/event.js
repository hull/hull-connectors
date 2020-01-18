// @flow

import type { HullContext, HullEvent } from "hull";
import _ from "lodash";
import segmentEvent from "../../lib/segment-event";

const eventUpdate = ({
  ctx,
  traits = {},
  analytics,
  anonymousId,
  userId,
  groupId
}: {
  ctx: HullContext,
  traits: {},
  analytics: any,
  anonymousId?: null | string,
  userId?: null | string,
  groupId?: null | string
}) => async (event: HullEvent) => {
  const { connector, metric } = ctx;
  const { private_settings } = connector;
  const { forward_events, synchronized_events } = private_settings;
  const { event: eventName, event_source } = event;

  if (event_source === "segment" && !forward_events) {
    // Skip event if it comes from Segment and we're not forwarding events
    return undefined;
    // return {
    //   message_id,
    //   action: "skip",
    //   message: "Event comes from segment and forward_events is disabled",
    //   id: user.id,
    //   type: "user",
    //   data: { anonymousId, userId, event_id }
    // };
  }

  if (
    !_.includes(synchronized_events, eventName) &&
    !_.includes(synchronized_events, "ALL")
  ) {
    return undefined;
    // return {
    //   message_id,
    //   action: "skip",
    //   message: "Event not in whitelisted list",
    //   id: user.id,
    //   type: "user",
    //   data: { anonymousId, userId, event_id }
    // };
  }

  const track = await segmentEvent({
    analytics,
    event,
    anonymousId,
    userId,
    groupId,
    traits
  });

  // const type =
  //   eventName === "page" || eventName === "screen" ? eventName : "track";

  if (track.channel === "browser") {
    metric.increment("ship.service_api.call", 1, ["type:page"]);
  } else if (track.channel === "mobile") {
    metric.increment("ship.service_api.call", 1, ["type:screen"]);
  } else {
    metric.increment("ship.service_api.call", 1, ["type:track"]);
  }
  return undefined;
};

export default eventUpdate;

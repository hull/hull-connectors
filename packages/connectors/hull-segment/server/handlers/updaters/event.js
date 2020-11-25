// @flow

import type { HullClient, HullContext, HullEvent } from "hull";
import _ from "lodash";
import segmentEvent from "../../lib/segment-event";

const eventUpdate = ({
  ctx,
  asUser,
  traits = {},
  analytics,
  active,
  anonymousId,
  userId,
  groupId
}: {
  ctx: HullContext,
  traits: {},
  active?: boolean,
  asUser: HullClient,
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
    return asUser.logger.debug("outgoing.event.skip", {
      message: "Not forwarding Events from Segment",
      forward_events,
      event_source,
      eventName
    });
  }

  if (
    !_.includes(synchronized_events, eventName) &&
    !_.includes(synchronized_events, "ALL") &&
    !(
      eventName === "Entered Segment" &&
      _.includes(synchronized_events, "ENTERED_SEGMENT")
    ) &&
    !(
      eventName === "Left Segment" &&
      _.includes(synchronized_events, "LEFT_SEGMENT")
    )
  ) {
    return asUser.logger.debug("outgoing.event.skip", {
      message: "Event isn't in whitelist",
      synchronized_events,
      eventName
    });
  }

  const track = await segmentEvent({
    analytics,
    event,
    active,
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

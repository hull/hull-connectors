// @flow

import type {
  HullEntityName,
  HullAccountUpdateMessage,
  HullContext,
  HullUserUpdateMessage
  // HullAccountUpdateMessage
} from "hull";
import _ from "lodash";

const getPayloads = (
  ctx: HullContext,
  message: HullUserUpdateMessage | HullAccountUpdateMessage,
  { entity = "user" }: { entity: HullEntityName }
): Array<{}> => {
  const { client, connector, isBatch, helpers } = ctx;
  const { segmentChangesToEvents } = helpers;
  const { private_settings } = connector;
  const { group } = client.utils.traits;
  const {
    synchronized_events,
    synchronized_segments_enter,
    synchronized_segments_leave,
    synchronized_attributes
  } = private_settings;
  // $FlowFixMe
  const { changes, events = [] } = message;

  const hasEvent = t => _.includes(synchronized_events, t);
  const hasChange = values => change =>
    !!_.intersection(_.keys(_.get(changes, change)), values).length;
  const changedAttributes = hasChange(synchronized_attributes)(entity);
  const enteredSegments = hasChange(synchronized_segments_enter)(
    "segments.entered"
  );
  const leftSegments = hasChange(synchronized_segments_leave)("segments.left");

  const payloads = [];

  // Generate a list of pseudo-events that match the whitelisted events.
  const segmentEvents = segmentChangesToEvents(message, [
    ...synchronized_segments_enter,
    ...synchronized_segments_leave
  ]);
  const matchingEvents = _.filter(events, e =>
    _.includes(_.omit(events, "CREATED"), e.event)
  );

  if (
    // Always send on Batch updates
    isBatch ||
    // Send if entered some listed segments
    enteredSegments ||
    // Send if left some listed segments
    leftSegments ||
    // Send if some listed attributes changed
    changedAttributes ||
    // Send if entity was creared, and `created` event is listed
    (hasEvent("CREATED") && changes.is_new) ||
    // Send if some listed events are present
    matchingEvents.length
  ) {
    payloads.push({
      group,
      message: {
        ...message,
        account: group(message.account),
        // Only embed User key if entity is a User
        ...(entity === "user" && message.user
          ? { user: group(message.user) }
          : {}),
        events: [...segmentEvents, ...matchingEvents]
      }
    });
  }

  return payloads;
};
export default getPayloads;

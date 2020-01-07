// @flow

import type {
  HullContext,
  HullUserUpdateMessage
  // HullAccountUpdateMessage
} from "hull";
import _ from "lodash";

const groupEntities = ({ group, message }) => ({
  variables: {},
  ...message,
  user: group(message.user),
  account: group(message.account)
});
const getPayloads = (
  ctx: HullContext,
  message: HullUserUpdateMessage
): Array<{}> => {
  const { client, connector, isBatch } = ctx;
  const { private_settings } = connector;
  const { group } = client.utils.traits;
  const {
    synchronized_events,
    synchronized_segments_enter,
    synchronized_segments_leave,
    synchronized_attributes
  } = private_settings;
  const { changes, events = [] } = message;

  const hasEvent = t => _.includes(synchronized_events, t);
  const hasChange = values => change =>
    !!_.intersection(_.keys(_.get(changes, change)), values).length;
  const changedAttributes = hasChange(synchronized_attributes)("user");
  const enteredSegments = hasChange(synchronized_segments_enter)(
    "segments.entered"
  );
  const leftSegments = hasChange(synchronized_segments_leave)("segments.left");

  const payloads = [];

  const matchingEvents = _.filter(events, e =>
    _.includes(_.omit(events, "ATTRIBUTE_CHANGE", "CREATED"), e.event)
  );
  if (
    isBatch ||
    enteredSegments ||
    leftSegments ||
    changedAttributes ||
    (hasEvent("CREATED") && changes.is_new) ||
    matchingEvents.length
  ) {
    payloads.push(
      groupEntities({
        group,
        message: {
          ...message,
          events: matchingEvents
        }
      })
    );
  }

  return payloads;
};
export default getPayloads;

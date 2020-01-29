// @flow

import type {
  HullUserChanges,
  HullAccountChanges,
  HullContext,
  HullUserUpdateMessage,
  HullEvent,
  HullSegment
} from "hull";
import _ from "lodash";

const segmentChangeToEvent = (
  direction: "entered" | "left",
  message_id: string
) => (segment: HullSegment): HullEvent => ({
  event: `${direction === "entered" ? "Entered" : "Left"} Segment`,
  event_id: `${message_id}-${segment.id}`,
  event_source: "hull",
  created_at: segment.created_at,
  context: {
    active: false
  },
  properties: {
    direction,
    ..._.pick(segment, "type", "id", "name", "created_at", "updated_at")
  }
});

// We're using _.get here to handle the multiple levels
// of undefined values that can happen
const mapChangeGroup = (
  message_id,
  group: $PropertyType<HullUserChanges, "segments">
) =>
  _.concat(
    _.map(
      _.get(group, "entered", []),
      segmentChangeToEvent("entered", message_id)
    ),
    _.map(_.get(group, "left", []), segmentChangeToEvent("left", message_id))
  );

const changesToEvents = (
  message_id: string,
  changes: HullUserChanges | HullAccountChanges
): Array<HullEvent> => {
  const userSegmentChanges = mapChangeGroup(
    message_id,
    _.get(changes, "segments", {})
  );
  if (!changes.account_segments) {
    return userSegmentChanges;
  }
  const accountSegmentChanges = mapChangeGroup(
    message_id,
    _.get(changes, "account_segments", {})
  );
  return _.concat(userSegmentChanges, accountSegmentChanges);
};

const segmentChangesToEvents = (_ctx: HullContext) => ({
  message_id,
  changes
}: HullUserUpdateMessage): Array<HullEvent> =>
  changesToEvents(message_id, changes || {});

module.exports = segmentChangesToEvents;

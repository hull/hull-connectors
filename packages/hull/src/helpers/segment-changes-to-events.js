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

const filteredSegments = (
  segments: Array<HullSegment>,
  whitelist: Array<string>
) =>
  whitelist.indexOf("ALL") > -1
    ? segments
    : _.filter(segments, s => whitelist.indexOf(s.id) !== -1);

// We're using _.get here to handle the multiple levels
// of undefined values that can happen
const mapChangeGroup = (
  message_id,
  group: $PropertyType<HullUserChanges, "segments">,
  whitelist: Array<string>
) =>
  _.concat(
    _.map(
      filteredSegments(_.get(group, "entered", []), whitelist),
      segmentChangeToEvent("entered", message_id)
    ),
    _.map(
      filteredSegments(_.get(group, "left", []), whitelist),
      segmentChangeToEvent("left", message_id)
    )
  );

const changesToEvents = (
  message_id: string,
  changes: HullUserChanges | HullAccountChanges,
  whitelist: Array<string>
): Array<HullEvent> => {
  const userSegmentChanges = mapChangeGroup(
    message_id,
    _.get(changes, "segments", {}),
    whitelist
  );
  if (!changes.account_segments) {
    return userSegmentChanges;
  }
  const accountSegmentChanges = mapChangeGroup(
    message_id,
    _.get(changes, "account_segments", {}),
    whitelist
  );
  return _.concat(userSegmentChanges, accountSegmentChanges);
};

const segmentChangesToEvents = (_ctx: HullContext) => (
  { message_id, changes }: HullUserUpdateMessage,
  whitelist: Array<string>
): Array<HullEvent> => changesToEvents(message_id, changes || {}, whitelist);

module.exports = segmentChangesToEvents;

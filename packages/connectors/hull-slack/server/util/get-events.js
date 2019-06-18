// @flow

import _ from "lodash";
import flattenForText from "./flatten-for-text";

const belongsToSegment = (sync_segment, entitySegmentIds) => {
  // sync_segments will be undefined if a manifest has not been refreshed
  if (sync_segment === undefined) {
    sync_segment = "ALL";
  }
  return sync_segment === "ALL" || _.includes(entitySegmentIds, sync_segment);
};

const getEvents = (events, notify_events, userSegmentIds) => {
  const messages = [];
  const triggered = [];
  if (notify_events.length) {
    const event_names = _.map(events, "event");
    const event_hash = _.compact(
      _.uniq(
        _.map(notify_events, ({ event, channel, synchronized_segment }) => {
          if (
            _.includes(event_names, event) &&
            belongsToSegment(synchronized_segment, userSegmentIds)
          ) {
            triggered.push(channel);
            return event;
          }
          return undefined;
        })
      )
    );
    if (triggered.length) {
      messages.push(`Performed ${flattenForText(event_hash)}`);
    }
  }
  return { triggered, messages };
};

module.exports = getEvents;

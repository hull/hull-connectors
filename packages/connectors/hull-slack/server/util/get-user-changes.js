// @flow
import _ from "lodash";
import humanize from "../lib/humanize";
import flattenForText from "./flatten-for-text";

const SEGMENT_ACTION_TYPE = {
  enter: "enter",
  leave: "leave"
};

const SEGMENT_CHANGE_EVENTS = [
  {
    event: "ENTERED_USER_SEGMENT",
    type: SEGMENT_ACTION_TYPE.enter,
    path: "segments.entered"
  },
  {
    event: "LEFT_USER_SEGMENT",
    type: SEGMENT_ACTION_TYPE.leave,
    path: "segments.left"
  }
];

const belongsToSegment = (sync_segment, entitySegmentIds) => {
  // sync_segment will be undefined if a manifest has not been refreshed
  if (sync_segment === undefined) {
    sync_segment = "ALL";
  }

  return sync_segment === "ALL" || _.includes(entitySegmentIds, sync_segment);
};

const getUserChanges = (changes, notify_segments, notify_events) => {
  let messages = [];
  const entered = [];
  const left = [];

  if (
    changes &&
    changes.segments &&
    (changes.segments.entered || changes.segments.left)
  ) {
    messages = _.map(changes.segments, (values, action) => {
      const names = _.map(values, "name");
      const s = names.length > 1 ? "s" : "";
      return `${humanize(action)} segment${s} ${flattenForText(names)}`;
    });

    _.map(notify_segments, notify => {
      const { segment, channel, enter, leave } = notify;
      if (enter && _.includes(_.map(changes.segments.entered, "id"), segment)) {
        entered.push(channel);
      }
      if (leave && _.includes(_.map(changes.segments.left, "id"), segment)) {
        left.push(channel);
      }
    });

    // Processing segment changes as events:
    _.map(notify_events, notify => {
      const { event, synchronized_segment, channel } = notify;

      const segment_change_event = _.find(SEGMENT_CHANGE_EVENTS, e => {
        return e.event === event;
      });

      if (segment_change_event !== undefined) {
        const action_type = segment_change_event.type;
        const segment_changes = _.get(changes, segment_change_event.path);

        if (
          segment_changes !== undefined &&
          belongsToSegment(synchronized_segment, _.map(segment_changes, "id"))
        ) {
          if (action_type === SEGMENT_ACTION_TYPE.enter) {
            entered.push(channel);
          } else if (action_type === SEGMENT_ACTION_TYPE.leave) {
            left.push(channel);
          }
        }
      }
    });
  }
  return { entered, left, messages };
};

module.exports = getUserChanges;

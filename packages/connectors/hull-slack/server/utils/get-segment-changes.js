// @flow

const _ = require("lodash");

const getSegmentChanges = ({ event, synchronized_segment, changes }) => {

  // TODO temporary quick fix
  let segmentChangesPath = null;
  if (event === "ENTERED_USER_SEGMENT") {
    segmentChangesPath = "segments.entered";
  } else if (event === "LEFT_USER_SEGMENT") {
    segmentChangesPath = "segments.left";
  } else if (event === "ENTERED_ACCOUNT_SEGMENT") {
    segmentChangesPath = "account_segments.entered";
  } else if (event === "LEFT_ACCOUNT_SEGMENT") {
    segmentChangesPath = "account_segments.left";
  }

  if (_.isNil(segmentChangesPath)) {
    return [];
  }

  const segmentChanges = _.get(changes, segmentChangesPath, []);
  if (_.isEmpty(segmentChanges)) {
    return [];
  }
  const segments_entered = synchronized_segment === "ALL" ? segmentChanges :
    _.compact([_.find(segmentChanges, e => e.id === synchronized_segment)]);

  let valid_events = [];
  if (segments_entered) {
    _.forEach(segments_entered, segment_entered => {
      valid_events = _.concat(valid_events, [
        {
          event: {
            event: _.startCase(_.toLower(_.startCase(event)))
          },
          segment: segment_entered
        }
      ])
    });
  }
  return valid_events;
};

module.exports = {
  getSegmentChanges
};

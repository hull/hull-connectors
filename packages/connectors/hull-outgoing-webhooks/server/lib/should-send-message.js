// @flow
//
import _ from "lodash";

const getSegmentNames = (changes, direction) =>
  _.map(_.get(changes, "segments", direction), "name");

const shouldSendMessage = (private_settings: any, message: any) => {
  const {
    trigger,
    synchronized_segments,
    synchronized_attributes
  } = private_settings;
  const { changes, events } = message;

  if (
    _.includes(trigger, "ATTRIBUTE_CHANGE") &&
    _.intersection(_.keys(_.get(changes, "user")), synchronized_attributes)
      .length
  )
    return true;
  if (
    _.includes(trigger, "ENTERED_SEGMENT") &&
    _.intersection(getSegmentNames(changes, "entered"), synchronized_segments)
      .length
  )
    return true;
  if (
    _.includes(trigger, "LEFT_SEGMENT") &&
    _.intersection(getSegmentNames(changes, "left"), synchronized_segments)
      .length
  )
    return true;
  if (_.includes(trigger, "CREATED") && changes.is_new) return true;
  if (_.intersection(trigger, _.map(events, "event"))) return true;
  return false;
};
export default shouldSendMessage;

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
  const { client, connector } = ctx;
  const { private_settings } = connector;
  const { group } = client.utils.traits;
  const {
    trigger,
    synchronized_segments,
    synchronized_attributes
  } = private_settings;
  const { changes, events = [] } = message;

  const hasTrigger = t => _.includes(trigger, t);
  const hasChange = ch => obj =>
    _.intersection(_.keys(_.get(changes, obj)), ch).length;
  const hasAttributeChange = hasChange(synchronized_attributes);
  const hasSegmentChange = hasChange(synchronized_segments);

  const payloads = [];

  const matchingEvents = _.filter(events, e =>
    _.includes(
      _.omit(
        events,
        "ATTRIBUTE_CHANGE",
        "ENTERED_SEGMENT",
        "LEFT_SEGMENT",
        "CREATED"
      ),
      e.event
    )
  );
  if (
    (hasTrigger("ATTRIBUTE_CHANGE") && hasAttributeChange("user")) ||
    (hasTrigger("ENTERED_SEGMENT") && hasSegmentChange("segments.entered")) ||
    (hasTrigger("LEFT_SEGMENT") && hasSegmentChange("segments.left")) ||
    (_.includes(trigger, "CREATED") && changes.is_new) ||
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

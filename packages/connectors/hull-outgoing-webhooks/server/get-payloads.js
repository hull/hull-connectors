// @flow

import _ from "lodash";

const {
  hasValidTrigger
} = require("hull-connector-framework/src/purplefusion/triggers/trigger-utils");

const getPayloads = ({ ctx, message, entity, triggers }): Array<{}> => {
  const { client, connector, isBatch, helpers } = ctx;
  const { segmentChangesToEvents } = helpers;
  const { private_settings } = connector;
  const { group } = client.utils.traits;
  const {
    synchronized_segments_enter,
    synchronized_segments_leave
  } = private_settings;

  const { events = [] } = message;

  const payloads = [];
  if (isBatch || hasValidTrigger(message, triggers)) {
    const segmentEvents = segmentChangesToEvents(message, [
      ...synchronized_segments_enter,
      ...synchronized_segments_leave
    ]);
    const matchingEvents = _.filter(events, e =>
      _.includes(_.omit(events, "CREATED"), e.event)
    );

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

// @flow

import _ from "lodash";

const {
  hasValidTrigger
} = require("hull-connector-framework/src/purplefusion/triggers/trigger-utils");

const groupEntities = ({ group, message }) => ({
  ...message,
  user: group(message.user),
  account: group(message.account)
});

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

    payloads.push(
      groupEntities({
        group,
        message: {
          ...message,
          account: group(message.account),
          ...(entity === "user" && message.user
            ? { user: group(message.user) }
            : {}),
          events: [...segmentEvents, ...matchingEvents]
        }
      })
    );
  }

  return payloads;
};
export default getPayloads;

// @flow

import _ from "lodash";
import type {
  HullContext,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullEntityName
} from "hull";

const groupEntities = ({ group, message }) => ({
  ...message,
  user: group(message.user),
  account: group(message.account)
});

type GetPayloadParams = {
  ctx: HullContext,
  message: HullUserUpdateMessage | HullAccountUpdateMessage,
  entity: HullEntityName,
  triggers: {}
};

const getPayloads = ({
  ctx,
  message,
  entity,
  triggers
}: GetPayloadParams): Array<{}> => {
  const { client, connector, helpers } = ctx;
  const {
    segmentChangesToEvents,
    hasMatchingSegments,
    hasMatchingTriggers
  } = helpers;
  const { private_settings } = connector;
  const { group } = client.utils.traits;
  const {
    synchronized_segments_whitelist,
    synchronized_segments_blacklist,
    synchronized_segments_enter,
    synchronized_segments_leave
  } = private_settings;

  const { events = [] } = message;

  const payloads = [];
  if (
    hasMatchingTriggers({ message, triggers }) &&
    hasMatchingSegments({
      matchOnBatch: true,
      whitelist: synchronized_segments_whitelist,
      blacklist: synchronized_segments_blacklist,
      entity,
      message
    })
  ) {
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

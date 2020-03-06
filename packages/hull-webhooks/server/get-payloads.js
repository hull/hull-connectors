// @flow

import _ from "lodash";
import type {
  HullContext,
  HullTriggerSet,
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
  triggers: HullTriggerSet,
  filters: HullTriggerSet
};

const getPayloads = ({
  ctx,
  message,
  entity,
  triggers,
  filters
}: GetPayloadParams): Array<{}> => {
  const { client, connector, helpers } = ctx;
  const { segmentChangesToEvents, hasMatchingTriggers } = helpers;
  const { private_settings } = connector;
  const { group } = client.utils.traits;
  const {
    synchronized_segments_enter,
    synchronized_segments_leave,
    synchronized_events
  } = private_settings;

  if (
    !hasMatchingTriggers({
      mode: "all",
      message,
      matchOnBatch: true,
      triggers: filters
    }) ||
    !hasMatchingTriggers({ mode: "any", message, triggers, matchOnBatch: true })
  ) {
    return [];
  }
  const { events = [] } = message;

  const segmentEvents = segmentChangesToEvents(message, [
    ...synchronized_segments_enter,
    ...synchronized_segments_leave
  ]);
  const matchingEvents = _.filter(events, e =>
    _.includes(_.omit(synchronized_events, "CREATED"), e.event)
  );

  return [
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
  ];
};
export default getPayloads;

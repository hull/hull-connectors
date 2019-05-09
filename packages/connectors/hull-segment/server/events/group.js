// @flow

import Promise from "bluebird";
import type { HullContext, SegmentIncomingGroup } from "../types";

export default function handleGroup(
  { client, metric }: HullContext,
  message: SegmentIncomingGroup
) {
  const { groupId, userId, traits } = message;
  if (!message || !groupId) return Promise.resolve();

  const scopedClient = userId
    ? client.asUser({ external_id: userId }).account({ external_id: groupId })
    : client.asAccount({ external_id: groupId });
  scopedClient.logger.info(`incoming.account.success`, traits);
  metric.increment(`request.group.success`);
  return scopedClient.traits(traits);
}

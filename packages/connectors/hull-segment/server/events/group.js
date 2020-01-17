// @flow

import type { HullContext } from "hull";
import type { SegmentIncomingGroup } from "../types";

export default async function handleGroup(
  { client, metric }: HullContext,
  message: SegmentIncomingGroup
) {
  const { groupId, userId, anonymousId, traits } = message;
  if (!message || !groupId) return null;

  const scopedClient = client
    .asUser(userId ? { external_id: userId } : { anonymous_id: anonymousId })
    .account({ external_id: groupId });
  scopedClient.logger.info("incoming.account.success", traits);
  metric.increment("request.group.success");
  await scopedClient.traits(traits);
  return undefined;
}

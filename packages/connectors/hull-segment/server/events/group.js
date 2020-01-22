// @flow

import type { HullContext } from "hull";
import type { SegmentIncomingGroup } from "../types";

export default async function handleGroup(
  { client, metric, connector }: HullContext,
  message: SegmentIncomingGroup
) {
  const { private_settings } = connector;
  const { link_users_in_hull } = private_settings;
  const { groupId, userId, anonymousId, traits } = message;
  if (!message || !groupId) return null;

  const scopedClient = link_users_in_hull
    ? client
        .asUser(
          userId ? { external_id: userId } : { anonymous_id: anonymousId }
        )
        .account({ external_id: groupId })
    : client.asAccount({ external_id: groupId });
  await scopedClient.traits(traits);
  metric.increment("request.group");
  return undefined;
}

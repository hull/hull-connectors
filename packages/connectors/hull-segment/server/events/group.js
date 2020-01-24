// @flow

import type { HullContext, HullAccountClaims } from "hull";
import type { SegmentIncomingGroup } from "../types";

export default async function handleGroup(
  { client, connector }: HullContext,
  message: SegmentIncomingGroup
) {
  const { private_settings } = connector;
  const { link_users_in_hull } = private_settings;
  const { groupId, userId, anonymousId, traits } = message;
  const { domain } = traits;
  if (!message || !groupId) return null;

  const accountClaims: HullAccountClaims = {
    external_id: groupId
  };
  if (domain) {
    accountClaims.domain = domain;
  }

  const scopedClient = link_users_in_hull
    ? client
        .asUser(
          userId ? { external_id: userId } : { anonymous_id: anonymousId }
        )
        .account({ external_id: groupId })
    : client.asAccount(accountClaims);
  await scopedClient.traits(traits);
  return undefined;
}

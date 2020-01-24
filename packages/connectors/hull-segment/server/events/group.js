// @flow

import type { HullContext } from "hull";
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

  const accountClaims = {
    external_id: groupId
  };
  if (domain) {
    accountClaims.domain = domain;
  }
  console.log(domain, accountClaims)

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

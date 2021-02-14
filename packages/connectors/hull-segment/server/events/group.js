// @flow

import _, { isEmpty, reduce, includes } from "lodash";
import scoped from "../scope-hull-client";
import type { HullContext } from "hull";

export default async function handleGroup({ metric, client }, payload = {}) {
  const { groupId, userId, traits } = payload;
  if (groupId) {
    const accountIdentity = { external_id: groupId };

    const domain = get(payload, "traits.domain");

    if (!isEmpty(domain)) {
      accountIdentity.domain = domain;
    }

    const asAccount = userId
      ? client.asUser({ external_id: userId }).account(accountIdentity)
      : client.asAccount(accountIdentity);

    try {
      asAccount.logger.debug("incoming.account.success", { payload });
    } catch (error) {
      metric("request.track.error");
      asAccount.logger.error("incoming.group.error", {
        payload,
        errors: error
      });
      throw error;

      // console.log("LOGGER ERROR");
      // console.log(e);
    }

    return asAccount.traits(traits);
  }
  return true;
}

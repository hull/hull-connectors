// @flow

import _ from "lodash";
import type {
  HullEntityName,
  HullUserUpdateMessage
  // HullAccountUpdateMessage
} from "hull";

const getClaims = (
  entity: HullEntityName,
  { user, account }: HullUserUpdateMessage
) => {
  const claims =
    entity === "account"
      ? _.pick(account, ["domain", "id", "external_id"])
      : _.pick(user, ["email", "id", "external_id"]);
  const aid = _.first((entity === "account" ? account : user).anonymous_ids);
  if (aid) {
    claims.anonymous_id = aid;
  }
  return claims;
};
export default getClaims;

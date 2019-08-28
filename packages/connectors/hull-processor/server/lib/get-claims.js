// @flow

import _ from "lodash";

const getClaims = (
  entity: "user" | "account",
  { user, account }: HullUserUpdateMessage | HullAccountUpdateMessage
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

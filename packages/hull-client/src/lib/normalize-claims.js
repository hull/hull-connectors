// @flow
import type {
  HullUser,
  HullAccount,
  HullUserClaims,
  HullAccountClaims
} from "../types";

type InputUserClaim = string | HullUser | Object;

type InputAccountClaim = string | HullAccount | Object;

const _ = require("lodash");
/**
 * If you pass in a `HullUser`, it will have an `anonymous_ids` array property but no `anonymous_id` string property.
 * This method adapts the HullUser object shape to the HullClaims:
 * It extracts the first anonymous_id from anonymous_ids if
 * - it's present
 * - it's not empty
 * - there is no `anonymous_id` claim present
 * @param  {[type]} claims [description]
 * @return {[type]}        [description]
 */
const normalize = (claims: InputUserClaim | InputAccountClaim) =>
  typeof claims === "string"
    ? { id: claims }
    : _.reduce(
        claims,
        (c, v, k) => {
          // TODO: Can we implement this feature safely and add the anonymous_id from the array of anonymous_ids
          // It seems to me we could.
          // if (k === "anonymous_ids") {
          //   if (!claims.anonymous_id && v && v.length) {
          //     c.anonymous_id = v[0];
          //   }
          // } else {
          //   c[k] = v;
          // }
          c[k] = v;
          return c;
        },
        {}
      );
const normalizeUserClaims = (claims: InputUserClaim): $Shape<HullUserClaims> =>
  normalize(claims);
const normalizeAccountClaims = (
  claims: InputAccountClaim
): $Shape<HullAccountClaims> => normalize(claims);

module.exports = {
  normalizeUserClaims,
  normalizeAccountClaims
};

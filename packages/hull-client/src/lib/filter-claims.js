// @flow

import _ from "lodash";
import type {
  HullUser,
  HullAccount,
  HullEntityClaims,
  HullEntityType
} from "../types";

/**
 * All valid user claims, used for validation and filterind .asUser calls
 * @type {Array}
 */
const USER_CLAIMS: Array<string> = [
  "id",
  "email",
  "external_id",
  "anonymous_id"
];

/**
 * All valid accounts claims, used for validation and filtering .asAccount calls
 * @type {Array}
 */
const ACCOUNT_CLAIMS: Array<string> = [
  "id",
  "external_id",
  "domain",
  "anonymous_id"
];

const normalize = (claims: HullUser | HullAccount | Object): HullEntityClaims =>
  typeof claims === "string"
    ? { id: claims }
    : _.reduce(
        claims,
        (c, v, k) => {
          // @TODO: Can we implement this feature safely and add the anonymous_id from the array of anonymous_ids
          // It seems to me we could.
          // if (k === "anonymous_ids" && !claims.anonymous_id) {
          //   c.anonymous_id = _.first(v);
          // } else {
          c[k] = v;
          // }
          return c;
        },
        {}
      );

export const filterEntityClaims = (
  subject: HullEntityType,
  claims: void | string | HullUser | HullAccount | Object
): HullEntityClaims => {
  const claimsToFilter = subject === "user" ? USER_CLAIMS : ACCOUNT_CLAIMS;
  return normalize(
    typeof claims === "string" ? { id: claims } : _.pick(claims, claimsToFilter)
  );
};

/**
 * make sure that provided "identity claim" is valid
 * @param  {string} type          "user" or "account"
 * @param  {string|Object} object identity claim
 * claim is an object
 * @throws Error
 */
export const assertEntityClaimsValidity = (
  type: HullEntityType,
  object: void | string | HullEntityClaims
): void => {
  const claimsToCheck = type === "user" ? USER_CLAIMS : ACCOUNT_CLAIMS;
  if (!_.isEmpty(object)) {
    if (typeof object === "string") {
      if (!object) {
        throw new Error(`Missing ${type} ID`);
      }
    } else if (
      typeof object !== "object" ||
      _.intersection(_.keys(object), claimsToCheck).length === 0
    ) {
      throw new Error(
        `You need to pass an ${type} hash with an ${claimsToCheck.join(
          ", "
        )} field`
      );
    }
  }
};

// @flow

import type { HullClient, HullEntityClaims, HullEntityType } from "hull";
import type { ClaimsValidation } from "../types";

export const isValidClaim = (
  claims: HullEntityClaims,
  client: HullClient,
  entityType: HullEntityType
): ClaimsValidation => {
  try {
    const method = entityType === "account" ? client.asAccount : client.asUser;
    // $FlowFixMe
    method(claims);
    return {
      valid: true,
      error: undefined,
      message: undefined,
      // $FlowFixMe
      claims,
      entityType
    };
  } catch (err) {
    return {
      valid: false,
      message: `Invalid Claims for ${entityType}`,
      error: err.toString(),
      // $FlowFixMe
      claims,
      entityType
    };
  }
};

export const hasValidClaims = (entity: HullEntityType) => (
  claims: HullEntityClaims,
  client: HullClient
) => isValidClaim(claims, client, entity);

export const hasValidUserClaims = hasValidClaims("user");
export const hasValidAccountClaims = hasValidClaims("account");
export const hasValidLinkclaims = hasValidClaims("account");

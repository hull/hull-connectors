// @flow

import type { HullClient, HullEntityClaims, HullEntityType } from "hull";
import _ from "lodash";
import type { ClaimsValidation } from "../types";

export const isValidClaim = (
  claims: HullEntityClaims,
  client: HullClient,
  entityType: HullEntityType,
  acceptsEmpty: boolean
): ClaimsValidation => {
  try {
    const method = entityType === "account" ? client.asAccount : client.asUser;
    if (acceptsEmpty && (!claims || _.isEmpty(claims))) {
      const message =
        'Using Empty claims in ".account()" call. This is a deprecated syntax, please specify some claims';
      return {
        valid: true,
        error: undefined,
        message,
        claims,
        entityType
      };
    }
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

export const hasValidClaims = (
  entity: HullEntityType,
  acceptsEmpty: boolean
) => (claims: HullEntityClaims, client: HullClient) =>
  isValidClaim(claims, client, entity, acceptsEmpty);

export const hasValidUserClaims = hasValidClaims("user", false);
export const hasValidAccountClaims = hasValidClaims("account", false);
export const hasValidLinkclaims = hasValidClaims("account", true);

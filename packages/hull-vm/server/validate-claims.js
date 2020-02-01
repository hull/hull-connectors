// @flow

import type { HullClient, HullEntityClaims, HullEntityName } from "hull";
import _ from "lodash";
import type { ClaimsValidation } from "../types";

export const isValidClaim = (
  claims: HullEntityClaims,
  client: HullClient,
  entity: HullEntityName,
  acceptsEmpty: boolean
): ClaimsValidation => {
  try {
    const method = entity === "account" ? client.asAccount : client.asUser;
    if (acceptsEmpty && (!claims || _.isEmpty(claims))) {
      const message =
        'Using Empty claims in ".account()" call. This is a deprecated syntax, please specify some claims';
      return {
        valid: true,
        error: undefined,
        message,
        claims,
        entity
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
      entity
    };
  } catch (err) {
    return {
      valid: false,
      message: `Invalid Claims for ${entity}`,
      error: err.toString(),
      // $FlowFixMe
      claims,
      entity
    };
  }
};

export const hasValidClaims = (
  entity: HullEntityName,
  acceptsEmpty: boolean
) => (claims: HullEntityClaims, client: HullClient) =>
  isValidClaim(claims, client, entity, acceptsEmpty);

export const hasValidUserClaims = hasValidClaims("user", false);
export const hasValidAccountClaims = hasValidClaims("account", false);
export const hasValidLinkclaims = hasValidClaims("account", true);

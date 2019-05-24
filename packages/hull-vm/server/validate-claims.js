// @flow

import type { HullClient, HullEntityClaims, HullAdditionalClaims } from "hull";
import type { ClaimsValidation, ClaimsSubject } from "../types";

export const isValidClaim = (
  claims: HullEntityClaims,
  claimsOptions: HullAdditionalClaims,
  client: HullClient
) => (subject: ClaimsSubject): ClaimsValidation => {
  try {
    const method = subject === "account" ? client.asAccount : client.asUser;
    return (
      // $FlowFixMe
      method(claims) && {
        valid: true,
        error: undefined,
        message: undefined,
        // $FlowFixMe
        claims,
        claimsOptions,
        subject
      }
    );
  } catch (err) {
    return {
      valid: false,
      message: `Invalid Claims for ${subject}`,
      error: err.toString(),
      // $FlowFixMe
      claims,
      claimsOptions,
      subject
    };
  }
};

export const hasValidClaims = (subject: ClaimsSubject) => (
  claims: HullEntityClaims,
  claimsOptions: HullAdditionalClaims,
  client: HullClient
) => isValidClaim(claims, claimsOptions, client)(subject);

export const hasValidUserClaims = hasValidClaims("user");
export const hasValidAccountClaims = hasValidClaims("account");

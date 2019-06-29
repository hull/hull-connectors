// @flow

import type { HullClient, HullEntityClaims } from "hull";
import _ from "lodash";
import type { ClaimsValidation, ClaimsSubject } from "../types";

export const isValidClaim = (claims: HullEntityClaims, client: HullClient) => (
  subject: ClaimsSubject,
  allowEmpty?: boolean
): ClaimsValidation => {
  try {
    const method = subject === "account" ? client.asAccount : client.asUser;
    return (
      // $FlowFixMe
      ((allowEmpty && (!claims || _.isEmpty(claims))) || method(claims)) && {
        valid: true,
        error: undefined,
        message: undefined,
        // $FlowFixMe
        claims,
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
      subject
    };
  }
};

export const hasValidClaims = (
  subject: ClaimsSubject,
  allowEmpty?: boolean
) => (claims: HullEntityClaims, client: HullClient) =>
  isValidClaim(claims, client)(subject, allowEmpty);

export const hasValidUserClaims = hasValidClaims("user");
export const hasValidAccountClaims = hasValidClaims("account");
export const hasValidLinkclaims = hasValidClaims("account", true);

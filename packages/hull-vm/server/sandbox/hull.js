// @flow
import type {
  HullAccountClaims,
  HullUserClaims,
  HullClient,
  HullEventProperties,
  HullEventContext,
  HullEntitySymbol
} from "hull";
import _ from "lodash";
import type { Attributes, AttributesContext, Event, Result } from "../../types";

import {
  hasValidUserClaims,
  hasValidAccountClaims,
  hasValidLinkclaims
} from "../validate-claims";

const trackFactory = (claims: HullUserClaims, target: Array<Event>) => (
  eventName: string,
  properties: HullEventProperties = {},
  context: HullEventContext = {}
) => {
  target.push({
    claims,
    event: { eventName, properties, context }
  });
};

const identifyFactory = <ClaimType>(
  claims: ClaimType,
  target: Map<ClaimType, Attributes>
) => (attributes: Attributes, options?: { source?: string } = {}) => {
  const { source } = options;
  const previousAttributes = target.get(claims) || {};
  target.set(claims, {
    ...previousAttributes,
    ..._.mapKeys(attributes, (v, k) => (source ? `${source}/${k}` : k))
  });
  // target.push({
  //   claims,
  //   claimsOptions,
  //   traits: { attributes, context }
  // });
};

const buildHullContext = (
  client: HullClient,
  { errors, userTraits, accountTraits, accountLinks, events }: Result,
  claimsScope?: HullUserClaims | HullAccountClaims,
  entity?: HullEntitySymbol = "user"
) => {
  const errorLogger = (message, method, validation) => {
    client.logger.info(`incoming.${message}.skip`, {
      method,
      validation
    });
    errors.push(
      `Error validating claims for ${method}  ${JSON.stringify(validation)}`
    );
  };

  function asAccountFactory(
    claims: HullAccountClaims,
    target: $PropertyType<Result, "accountTraits">,
    isLinkCall?: boolean
  ) {
    const validation =
      isLinkCall === true
        ? hasValidLinkclaims(claims, client)
        : hasValidAccountClaims(claims, client);
    const { valid } = validation;
    if (!valid) {
      errorLogger("user", "Hull.asAccount()", validation);
      return {};
    }

    const identify = identifyFactory(claims, target);
    return { identify, traits: identify };
  }

  const linksFactory = (
    claims: HullUserClaims,
    target: $PropertyType<Result, "accountLinks">
  ) => (accountClaims: HullAccountClaims) => {
    const account = asAccountFactory(accountClaims, accountTraits, true);
    if (!account.traits) {
      return {};
    }
    target.set(claims, accountClaims);
    // target.push({
    //   claims,
    //   claimsOptions,
    //   accountClaims,
    //   accountClaimsOptions
    // });
    return account;
  };

  const asAccount = (claims: HullAccountClaims) =>
    asAccountFactory(claims, accountTraits);

  function asUser(claims: HullUserClaims) {
    const validation = hasValidUserClaims(claims, client);
    const { valid, error } = validation;
    if (!valid || error) {
      errorLogger("user", "Hull.asUser()", validation);
      return {};
    }
    const track = trackFactory(claims, events);
    const identify = identifyFactory(claims, userTraits);
    const link = linksFactory(claims, accountLinks);
    return {
      traits: identify,
      account: link,
      identify,
      track
    };
  }

  if (claimsScope) {
    return (entity === "account" ? asAccount : asUser)(claimsScope);
  }
  return {
    /* Deprecated Syntax */
    user: asUser,
    account: asAccount,
    /* Proper Syntax */
    asUser,
    asAccount
  };
};

export default buildHullContext;

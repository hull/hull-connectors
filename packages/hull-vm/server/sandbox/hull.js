// @flow
import type {
  HullAccountClaims,
  HullUserClaims,
  HullEntityClaims,
  HullEntityName,
  HullClient,
  HullAttributeContext,
  HullEventProperties,
  HullEventContext
} from "hull";
import { Map } from "immutable";

import _ from "lodash";
import type {
  HullAliasOperation,
  Attributes,
  HullClaims,
  // Event,
  Result
} from "../../types";

import {
  hasValidUserClaims,
  hasValidAccountClaims,
  hasValidLinkclaims
} from "../validate-claims";

type Claims = {
  asUser?: HullUserClaims,
  asAccount?: HullAccountClaims,
  subjectType?: HullEntityName
};

const { applyContext } = require("hull-client/src/utils/traits");
const { filterEntityClaims } = require("hull-client/src/lib/filter-claims");

const buildHullContext = ({
  client,
  result,
  source,
  claims: scopedClaims,
  entity
}: {
  client: HullClient,
  result: Result,
  source?: string,
  claims?: HullUserClaims | HullAccountClaims,
  entity?: HullEntityName
}) => {
  const hasScopedClaims = scopedClaims && _.size(scopedClaims) && !!entity;
  const errorLogger = (message, method, validation) => {
    client.logger.debug(`incoming.${message}.skip`, {
      method,
      validation
    });
    result.errors.push(
      `Error validating claims for ${method}  ${JSON.stringify(validation)}`
    );
  };

  const deprecationLogger = message =>
    message && result.logs.unshift(`Warning: ${message}`);

  const claimsMap = ({
    asUser,
    asAccount,
    subjectType
  }: {
    asUser?: HullUserClaims,
    asAccount?: HullAccountClaims,
    subjectType?: HullEntityName
  }): HullClaims => {
    const filteredAsUser = filterEntityClaims("user", asUser);
    const filteredAsAccount = filterEntityClaims("account", asAccount);
    const rec = _.omitBy(
      {
        ...(filteredAsUser ? { asUser: Map(filteredAsUser) } : {}),
        ...(filteredAsAccount ? { asAccount: Map(filteredAsAccount) } : {}),
        subjectType: subjectType || (asUser ? "user" : "account")
      },
      _.isEmpty
    );
    return Map(rec);
  };

  const trackFactory = ({ asUser, subjectType }: Claims) => (
    eventName: string,
    properties: HullEventProperties = {},
    context: HullEventContext = {}
  ) => {
    result.events.push({
      claims: claimsMap({ asUser, subjectType }),
      event: {
        eventName,
        properties,
        context: { source, ...context }
      }
    });
  };
  const aliasFactory = (
    { asUser, asAccount, subjectType }: Claims,
    operation: HullAliasOperation
  ) => (alias: HullEntityClaims) => {
    const target = subjectType === "user" ? "userAliases" : "accountAliases";
    // sets the rigth operation for the claim and the given alias.
    // perform deep value equality checks.
    result[target] = result[target].setIn(
      [claimsMap({ asUser, asAccount, subjectType }), Map({ ...alias })],
      operation
    );
  };

  const identifyFactory = ({ asUser, asAccount, subjectType }: Claims) => (
    attributes: Attributes,
    context?: HullAttributeContext = {}
  ) => {
    const target = subjectType === "user" ? "userTraits" : "accountTraits";
    // ensures the claims and calls are properly collapsed and aggregated
    result[target] = result[target].mergeDeepIn(
      [claimsMap({ asUser, asAccount, subjectType })],
      Map(applyContext(attributes, context))
    );
  };

  function asAccountFactory({
    asUser,
    asAccount
  }: {
    asUser?: HullUserClaims,
    asAccount: HullAccountClaims
  }) {
    const validation = asUser
      ? hasValidLinkclaims(asAccount, client)
      : hasValidAccountClaims(asAccount, client);
    const { valid, message } = validation;
    if (!valid) {
      errorLogger("user", "Hull.asAccount()", validation);
      return {};
    }
    deprecationLogger(message);
    const identify = identifyFactory({
      asUser,
      asAccount,
      subjectType: "account"
    });
    const alias = aliasFactory(
      { asUser, asAccount, subjectType: "account" },
      "alias"
    );
    const unalias = aliasFactory(
      { asUser, asAccount, subjectType: "account" },
      "unalias"
    );
    return { identify, traits: identify, alias, unalias };
  }

  const accountLinkFactory = ({ asUser, subjectType }: Claims) => (
    asAccount: HullAccountClaims
  ) => {
    const account = asAccountFactory({ asUser, asAccount });
    if (!account.traits) {
      return {};
    }

    if (hasScopedClaims && !_.isEqual(asUser, scopedClaims)) {
      deprecationLogger(
        "You're using hull.asAccount() inside a Processor, This is an advanced and unsafe method that might generate infinite loops. If you're just trying to update the current account, please use hull.traits() and hull.track() instead"
      );
    }

    result.accountLinks = result.accountLinks.set(
      claimsMap({ asUser, subjectType }),
      Map(filterEntityClaims("account", asAccount))
    );

    return account;
  };

  const asAccountCollector = (asAccount: HullAccountClaims) =>
    asAccountFactory({ asAccount });

  function asUserCollector(asUser: HullUserClaims) {
    const validation = hasValidUserClaims(asUser, client);
    const { valid, error, message } = validation;
    if (!valid || error) {
      errorLogger("user", "Hull.asUser()", validation);
      return {};
    }
    deprecationLogger(message);
    if (hasScopedClaims && !_.isEqual(asUser, scopedClaims)) {
      deprecationLogger(
        "You're using hull.asUser() inside a Processor, This is an advanced and unsafe method that might generate infinite loops. If you're just trying to update the current user, please use hull.traits() and hull.track() instead"
      );
    }
    const track = trackFactory({ asUser, subjectType: "user" });
    const alias = aliasFactory({ asUser, subjectType: "user" }, "alias");
    const unalias = aliasFactory({ asUser, subjectType: "user" }, "unalias");
    const identify = identifyFactory({ asUser, subjectType: "user" });
    const link = accountLinkFactory({ asUser, subjectType: "user" });

    return {
      traits: identify,
      account: link,
      alias,
      unalias,
      identify,
      track
    };
  }

  const hull = {
    /* Deprecated Syntax */
    user: asUserCollector,
    account: asAccountCollector,
    /* Proper Syntax */
    asUser: asUserCollector,
    asAccount: asAccountCollector
  };
  if (!hasScopedClaims) {
    return hull;
  }
  if (entity === "account") {
    return {
      ...hull,
      ...hull.asAccount(scopedClaims)
    };
  }
  return {
    ...hull,
    ...hull.asUser(scopedClaims)
  };
};

export default buildHullContext;

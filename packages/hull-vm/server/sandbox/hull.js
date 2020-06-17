// @flow
import type {
  HullAccountClaims,
  HullUserClaims,
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
  // Event,
  Result
} from "../../types";

import {
  hasValidUserClaims,
  hasValidAccountClaims,
  hasValidLinkclaims
} from "../validate-claims";

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
      `Error validating claims for ${method} ${JSON.stringify(validation)}`
    );
  };

  const deprecationLogger = message =>
    message && result.logs.unshift(`Warning: ${message}`);

  const trackFactory = (claims: HullUserClaims, target: string) => (
    eventName: string,
    properties: HullEventProperties = {},
    context: HullEventContext = {}
  ) => {
    result[target].push({
      claims: filterEntityClaims("user", claims),
      event: {
        eventName,
        properties,
        context: { source, ...context }
      }
    });
  };
  const aliasFactory = <ClaimType = HullUserClaims | HullAccountClaims>(
    claims: ClaimType,
    operation: HullAliasOperation,
    target: "userAliases" | "accountAliases"
  ) => (alias: ClaimType) => {
    if (
      (!_.isEmpty(alias) &&
        (_.isString(alias) || !_.has(alias, "anonymous_id"))) ||
      _.isObject(alias.anonymous_id)
    ) {
      deprecationLogger(
        `Incorrect alias format '${JSON.stringify(
          alias
        )}'. Please use '.alias({ anonymous_id: "..." })'`
      );
    }

    // sets the right operation for the claim and the given alias.
    // perform deep value equality checks.
    result[target] = result[target].setIn(
      [
        Map(
          filterEntityClaims(
            target === "userAliases" ? "user" : "account",
            claims
          )
        ),
        Map({ ...alias })
      ],
      operation
    );
  };

  const identifyFactory = <ClaimType = HullUserClaims | HullAccountClaims>(
    claims: ClaimType,
    target: "userTraits" | "accountTraits"
  ) => (attributes: Attributes, context?: HullAttributeContext = {}) => {
    // ensures the claims and calls are properly collapsed and aggregated
    result[target] = result[target].withMutations(map => {
      map.mergeDeepIn(
        [
          Map(
            filterEntityClaims(
              target === "userTraits" ? "user" : "account",
              claims
            )
          )
        ],
        Map(applyContext(attributes, context))
      );
    });
  };

  function asAccountFactory(claims: HullAccountClaims, isLinkCall?: boolean) {
    const validation =
      isLinkCall === true
        ? hasValidLinkclaims(claims, client)
        : hasValidAccountClaims(claims, client);
    const { valid, message } = validation;
    if (!valid) {
      errorLogger("user", "Hull.asAccount()", validation);
      return {};
    }
    deprecationLogger(message);
    const identify = identifyFactory(claims, "accountTraits");
    const alias = aliasFactory(claims, "alias", "accountAliases");
    const unalias = aliasFactory(claims, "unalias", "accountAliases");
    return { identify, traits: identify, alias, unalias };
  }

  const linksFactory = (claims: HullUserClaims) => (
    accountClaims: HullAccountClaims
  ) => {
    const account = asAccountFactory(accountClaims, true);
    if (!account.traits) {
      return {};
    }
    if (hasScopedClaims && !_.isEqual(claims, scopedClaims)) {
      deprecationLogger(
        "You're using hull.asAccount() inside a Processor, This is an advanced and unsafe method that might generate infinite loops. If you're just trying to update the current account, please use hull.traits() and hull.track() instead"
      );
    }
    result.accountLinks = result.accountLinks.set(
      Map(filterEntityClaims("user", claims)),
      Map(filterEntityClaims("account", accountClaims))
    );
    return account;
  };

  const asAccount = (claims: HullAccountClaims) => asAccountFactory(claims);

  function asUser(claims: HullUserClaims) {
    const validation = hasValidUserClaims(claims, client);
    const { valid, error, message } = validation;
    if (!valid || error) {
      errorLogger("user", "Hull.asUser()", validation);
      return {};
    }
    deprecationLogger(message);
    if (hasScopedClaims && !_.isEqual(claims, scopedClaims)) {
      deprecationLogger(
        "You're using hull.asUser() inside a Processor, This is an advanced and unsafe method that might generate infinite loops. If you're just trying to update the current user, please use hull.traits() and hull.track() instead"
      );
    }
    const track = trackFactory(claims, "events");
    const alias = aliasFactory(claims, "alias", "userAliases");
    const unalias = aliasFactory(claims, "unalias", "userAliases");
    const identify = identifyFactory(claims, "userTraits");
    const link = linksFactory(claims);
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
    user: asUser,
    account: asAccount,
    /* Proper Syntax */
    asUser,
    asAccount
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

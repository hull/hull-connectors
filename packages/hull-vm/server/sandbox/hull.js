// @flow
import type {
  HullAccountClaims,
  HullUserClaims,
  HullEntityClaims,
  HullEntityType,
  HullClient,
  HullAttributeContext,
  HullEventProperties,
  HullEventContext
} from "hull";
import { Map, Record } from "immutable";
import type {
  HullAliasOperation,
  Attributes,
  HullClaimsRecord,
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
  asAccount?: HullAccountClaims
};

const { applyContext } = require("hull-client/src/utils/traits");
const { filterEntityClaims } = require("hull-client/src/lib/filter-claims");

const recordFactory = Record({
  asUser: undefined,
  asAccount: undefined,
  subject: "user"
});

const buildHullContext = (
  client: HullClient,
  result: Result,
  eventsource?: string
) => {
  const errorLogger = (message, method, validation) => {
    client.logger.info(`incoming.${message}.skip`, {
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
    asAccount
  }: {
    asUser?: HullUserClaims,
    asAccount?: HullAccountClaims
  }): HullClaimsRecord => {
    return new recordFactory({
      asUser: filterEntityClaims("user", asUser),
      asAccount: filterEntityClaims("user", asAccount),
      subject: asUser ? "user" : "account"
    });
  };

  const trackFactory = (asUser: HullUserClaims, _subject: HullEntityType) => (
    eventName: string,
    properties: HullEventProperties = {},
    context: HullEventContext = {}
  ) => {
    console.log("EVENT", asUser, claimsMap({ asUser }));
    // const target = "events";
    result.events.push({
      claims: claimsMap({ asUser }),
      event: {
        eventName,
        properties,
        context: { source: eventsource, ...context }
      }
    });
  };
  const aliasFactory = (
    { asUser, asAccount }: Claims,
    subject: HullEntityType,
    operation: HullAliasOperation
  ) => (alias: HullEntityClaims) => {
    const target = subject === "user" ? "userAliases" : "accountAliases";
    // sets the rigth operation for the claim and the given alias.
    // perform deep value equality checks.
    result[target] = result[target].setIn(
      [claimsMap({ asUser, asAccount }), Map({ ...alias })],
      operation
    );
  };

  const identifyFactory = (
    { asUser, asAccount }: Claims,
    subject: HullEntityType
  ) => (attributes: Attributes, context?: HullAttributeContext = {}) => {
    const target = subject === "user" ? "userTraits" : "accountTraits";
    // ensures the claims and calls are properly collapsed and aggregated
    result[target] = result[target].mergeDeepIn(
      [claimsMap({ asUser, asAccount })],
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
    const identify = identifyFactory({ asUser, asAccount }, "account");
    const alias = aliasFactory({ asUser, asAccount }, "account", "alias");
    const unalias = aliasFactory({ asUser, asAccount }, "account", "unalias");
    return { identify, traits: identify, alias, unalias };
  }

  const accountLinkFactory = (asUser: HullUserClaims) => (
    asAccount: HullAccountClaims
  ) => {
    const account = asAccountFactory({ asUser, asAccount });
    if (!account.traits) {
      return {};
    }
    // result.accountLinks = result.accountLinks.set(
    //   claimsMap({ asUser }),
    //   Map(filterEntityClaims("user", asAccount))
    // );
    // With the new signature, ensure we have at least an empty traits call.
    // Subjsequent calls will add to the same data structure
    account.traits({});
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
    const track = trackFactory({ asUser }, "user");
    const alias = aliasFactory({ asUser }, "user", "alias");
    const unalias = aliasFactory({ asUser }, "user", "unalias");
    const identify = identifyFactory({ asUser }, "user");
    const link = accountLinkFactory({ asUser });
    return {
      traits: identify,
      account: link,
      alias,
      unalias,
      identify,
      track
    };
  }

  return {
    /* Deprecated Syntax */
    user: asUserCollector,
    account: asAccountCollector,
    /* Proper Syntax */
    asUser: asUserCollector,
    asAccount: asAccountCollector
  };
};

export default buildHullContext;

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
import { Map, Record } from "immutable";
import type { RecordFactory, RecordOf } from "immutable";

import _ from "lodash";
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

type ClaimsRecordProps = {
  asUser: HullUserClaims,
  asAccount: HullAccountClaims,
  subject: HullEntityName
};
type ClaimRecord = RecordOf<ClaimsRecordProps>;

const recordFactory: RecordFactory<ClaimsRecordProps> = Record({
  asUser: undefined,
  asAccount: undefined,
  subject: "user"
});

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
    asAccount
  }: {
    asUser?: HullUserClaims,
    asAccount?: HullAccountClaims
  }): HullClaimsRecord => {
    return new recordFactory(
      _.omitBy(
        {
          asUser: filterEntityClaims("user", asUser),
          asAccount: filterEntityClaims("user", asAccount),
          subject: asUser ? "user" : "account"
        },
        _.isEmpty
      )
    );
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
        context: { source, ...context }
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
    console.log("IDENTIFY", { asUser, asAccount, subject });
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

    if (hasScopedClaims && !_.isEqual(asUser, scopedClaims)) {
      deprecationLogger(
        "You're using hull.asAccount() inside a Processor, This is an advanced and unsafe method that might generate infinite loops. If you're just trying to update the current account, please use hull.traits() and hull.track() instead"
      );
    }

    result.accountLinks = result.accountLinks.set(
      Map(filterEntityClaims("user", asUser)),
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

// @flow
import _ from "lodash";
import type {
  HullContext,
  HullUser,
  HullAccount,
  HullEntityClaims
} from "hull";
import { callAlias, callLinks, callEvents, callTraits } from "./side-effects";
import type { Payload, Result } from "../types";

// const omitClaimOptions = traits => traits.map(u => _.omit(u, "claimsOptions"));

export default async function ingest(
  ctx: HullContext,
  result: Result,
  claims?: HullEntityClaims,
  payload?: Payload
) {
  const { client, metric } = ctx;

  const {
    events,
    userTraits,
    accountTraits,
    userAliases,
    accountAliases,
    accountLinks,
    logsForLogger,
    errors
  } = result;

  // $FlowFixMe
  const {
    user = {},
    account = {}
  }: {
    user?: HullUser,
    account?: HullAccount
  } = claims ? payload : {};

  const promises = [];

  client.logger.debug("compute.debug", result);

  // Update user traits
  if (_.size(userTraits)) {
    promises.push(
      callTraits({
        hullClient: client.asUser,
        payload: user,
        data: userTraits,
        entity: "user",
        metric
      })
    );
  }

  // Update user aliases
  if (_.size(userAliases)) {
    promises.push(
      callAlias({
        hullClient: client.asUser,
        payload: user,
        data: userAliases,
        entity: "user",
        metric
      })
    );
  }

  // Update account traits
  if (_.size(accountTraits)) {
    promises.push(
      callTraits({
        hullClient: client.asAccount,
        payload: account,
        data: accountTraits,
        entity: "account",
        metric
      })
    );
  }

  // Update account aliases
  if (_.size(accountAliases)) {
    promises.push(
      callAlias({
        hullClient: client.asAccount,
        payload: account,
        data: accountAliases,
        entity: "account",
        metric
      })
    );
  }

  // Emit events
  if (_.size(events)) {
    promises.push(
      callEvents({
        hullClient: client.asUser,
        data: events,
        entity: "event",
        metric
      })
    );
  }

  // Link accounts with users
  if (_.size(accountLinks)) {
    promises.push(
      callLinks({
        hullClient: client.asUser,
        payload: user,
        data: accountLinks,
        entity: "account",
        metric
      })
    );
  }

  if (errors && errors.length > 0) {
    client.logger.error("incoming.user.error", {
      hull_summary: `Error Processing user: ${errors
        .map(e => (_.isObject(e) ? JSON.stringify(e) : e))
        .join(", ")}`,
      errors
    });
  }

  if (logsForLogger && logsForLogger.length) {
    logsForLogger.map(log =>
      client.logger.info("compute.console.log", { log })
    );
  }

  // Wait until we've ingested everything
  return Promise.all(promises);
}

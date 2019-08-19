// @flow
import _ from "lodash";
import type { HullContext } from "hull";
import { callAlias, callLinks, callEvents, callTraits } from "./side-effects";
import type { Result } from "../types";
import serialize from "./serialize";

const debug = require("debug")("hull-incoming-webhooks:ingest");

// const omitClaimOptions = traits => traits.map(u => _.omit(u, "claimsOptions"));

export default async function ingest(ctx: HullContext, result: Result) {
  const { client, metric } = ctx;
  debug("ingest.result", result);

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

  const promises = [];

  client.logger.debug("compute.debug", serialize(result));

  // Update user traits
  if (_.size(userTraits)) {
    promises.push(
      callTraits({
        hullClient: client.asUser,
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
        data: accountLinks,
        entity: "account",
        metric
      })
    );
  }

  if (errors && errors.length > 0) {
    client.logger.error("incoming.user.error", {
      hull_summary: `Error Processing user: ${errors.join(", ")}`,
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

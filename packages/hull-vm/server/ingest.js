// @flow
import _ from "lodash";
import type { HullContext } from "hull";
import { callLinks, callEvents, callTraits } from "./side-effects";
import type { Payload, Result } from "../types";

const debug = require("debug")("hull-incoming-webhooks:ingest");

// const omitClaimOptions = traits => traits.map(u => _.omit(u, "claimsOptions"));

export default async function ingest(
  ctx: HullContext,
  {
    result,
    code,
    payload
  }: {
    result: Result,
    code: string,
    payload: Payload
  }
) {
  const { connector, client, metric } = ctx;
  debug("ingest.result", result);

  const {
    events,
    userTraits,
    accountTraits,
    accountLinks,
    logsForLogger,
    errors
  } = result;

  const promises = [];

  client.logger.info("compute.user.debug", result);

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
    promises.push(callLinks(client.asUser, accountLinks, "account", metric));
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
  return await Promise.all(promises);
}

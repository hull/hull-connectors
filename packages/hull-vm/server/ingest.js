// @flow
import _ from "lodash";
import type {
  HullContext,
  HullUser,
  HullAccount,
  HullEntityClaims
} from "hull";
import { callAlias, callEvents, callIdentify } from "./side-effects";
import type { Payload, SerializedResult } from "../types";

const debug = require("debug")("hull-incoming-webhooks:ingest");

// const omitClaimOptions = traits => traits.map(u => _.omit(u, "claimsOptions"));

export default async function ingest(
  ctx: HullContext,
  result: SerializedResult,
  claims?: HullEntityClaims,
  payload?: Payload
) {
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
      callIdentify({
        client,
        payload: user,
        data: userTraits,
        subjects: "user",
        metric
      })
    );
  }

  // Update user aliases
  if (_.size(userAliases)) {
    promises.push(
      callAlias({
        client,
        payload: user,
        data: userAliases,
        subjects: "user",
        metric
      })
    );
  }

  // Update account traits
  if (_.size(accountTraits)) {
    promises.push(
      callIdentify({
        client,
        payload: account,
        data: accountTraits,
        subjects: "account",
        metric
      })
    );
  }

  // Update account aliases
  if (_.size(accountAliases)) {
    promises.push(
      callAlias({
        client,
        payload: account,
        data: accountAliases,
        subjects: "account",
        metric
      })
    );
  }

  // Emit events
  if (_.size(events)) {
    promises.push(
      callEvents({
        client,
        data: events,
        entity: "event",
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

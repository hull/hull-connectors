// @flow
import _ from "lodash";
import type { HullEvent, HullEntityClaims } from "hull";
import type { Result, SerializedResult } from "../types";

// These methods transform ImmutableJS Maps to classic JS/JSON objects - this is a custom serialization since having Objects as Keys isn't supported in JSON for instance

const serializeClaim = (claim: string | Map<any>) =>
  _.isString(claim) ? claim : claim.toObject();

const serializeClaims = (claims: Map<any>) =>
  _.mapValues(claims.toObject(), serializeClaim);

const serializeAliases = (
  aliases: $PropertyType<Result, "userAliases">
): $PropertyType<SerializedResult, "userAliases"> =>
  aliases.toArray().map(([claims, operations]) => [
    serializeClaims(claims),
    operations.toArray().map(([claim, operation]) => ({
      claim: serializeClaim(claim),
      operation
    }))
  ]);

const serializeIdentify = (
  data: $PropertyType<Result, "userTraits">
): $PropertyType<SerializedResult, "userTraits"> =>
  data
    .toArray()
    .map(([claims, attributes]) => [
      serializeClaims(claims),
      attributes.toObject()
    ]);

const serializeLinks = (data: $PropertyType<Result, "accountLinks">) => data
  .toArray()
  .map(([claims, link]) => [serializeClaims(claims), link.toObject()]);
const serializeEvents = (
  events: Array<{ claims: HullEntityClaims, event: HullEvent }>
) =>
  _.map(events, event => ({
    ...event,
    claims: serializeClaims(event.claims)
  }));

const serialize = (result: Result) => ({
  ...result,
  events: serializeEvents(result.events),
  userTraits: serializeIdentify(result.userTraits),
  accountLinks: serializeLinks(result.accountLinks),
  accountTraits: serializeIdentify(result.accountTraits),
  userAliases: serializeAliases(result.userAliases),
  accountAliases: serializeAliases(result.accountAliases)
});

export default serialize;

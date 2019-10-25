// @flow
import type { Result, SerializedResult } from "../types";

// These methods transform ImmutableJS Maps to classic JS/JSON objects - this is a custom serialization since having Objects as Keys isn't supported in JSON for instance

const serializeAliases = (
  aliases: $PropertyType<Result, "userAliases">
): $PropertyType<SerializedResult, "userAliases"> =>
  aliases.toArray().map(([claims, operations]) => [
    claims.toObject(),
    operations.toArray().map(([claim, operation]) => {
      claim: claim.toObject, operation;
    })
  ]);

const serializeIdentify = (
  data: $PropertyType<Result, "userTraits">
): $PropertyType<SerializedResult, "userTraits"> =>
  data
    .toArray()
    .map(([claims, attributes]) => [claims.toObject(), attributes.toObject()]);

const serialize = (result: Result) => ({
  ...result,
  userTraits: serializeIdentify(result.userTraits),
  accountTraits: serializeIdentify(result.accountTraits),
  userAliases: serializeAliases(result.userAliases),
  accountAliases: serializeAliases(result.accountAliases)
});

export default serialize;

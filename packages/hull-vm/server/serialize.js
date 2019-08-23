// @flow
import type { Result } from "../types";

// These methods transform ImmutableJS Maps to classic JS/JSON objects - this is a custom serialization since having Objects as Keys isn't supported in JSON for instance

const serializeAliases = aliases => {
  return aliases
    .toArray()
    .map(([claims, operations]) => [
      claims.toObject(),
      operations
        .toArray()
        .map(([claim, operation]) => [claim.toObject(), operation])
    ]);
};

const serializeTraits = traits =>
  traits.toArray().map(trait => trait.map(t => t.toObject()));

const serialize = (result: Result) => ({
  ...result,
  userTraits: serializeTraits(result.userTraits),
  accountTraits: serializeTraits(result.accountTraits),
  userAliases: serializeAliases(result.userAliases),
  accountAliases: serializeAliases(result.accountAliases),
  accountLinks: Array.from(result.accountLinks)
});

export default serialize;

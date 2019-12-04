// @flow
import type { Result, SerializedResult } from "../types";

// These methods transform ImmutableJS Maps to classic JS/JSON objects - this is a custom serialization since having Objects as Keys isn't supported in JSON for instance

const serializeAliases = (
  aliases: $PropertyType<Result, "userAliases">
): $PropertyType<SerializedResult, "userAliases"> =>
  aliases
    .toArray()
    .map(([claims, operations]) => [
      claims.toObject(),
      operations
        .toArray()
        .map(([claim, operation]) => [claim.toObject(), operation])
    ]);

// [
//   [
//     claims,
//     [
//       [ claim, operation ]
//     ]
//   ]
// ]
//
//
//   return aliases
//     .toArray()
//     .map(([claims, operations]) => [
//       claims.toObject(),
//       operations
//         .toArray()
//         .map(([claim, operation]) => [claim.toObject(), operation])
//     ]);
// };

const serializeLinks = (
  links: $PropertyType<Result, "accountLinks">
): $PropertyType<SerializedResult, "accountLinks"> =>
  links
    .toArray()
    .map(([userClaims, accountClaims]) => [
      userClaims.toObject(),
      accountClaims.toObject()
    ]);

const serializeTraits = (
  traits: $PropertyType<Result, "userTraits">
): $PropertyType<SerializedResult, "userTraits"> =>
  traits
    .toArray()
    .map(([claims, attributes]) => [claims.toObject(), attributes.toObject()]);

const serialize = (result: Result) => ({
  ...result,
  userTraits: serializeTraits(result.userTraits),
  accountTraits: serializeTraits(result.accountTraits),
  userAliases: serializeAliases(result.userAliases),
  accountAliases: serializeAliases(result.accountAliases),
  accountLinks: serializeLinks(result.accountLinks)
});

export default serialize;

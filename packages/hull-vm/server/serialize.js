// @flow
import type { Result } from "../types";

const flattenAliases = aliases => {
  return Array.from(aliases).map(([claims, aa]) => [claims, Array.from(aa)]);
};

const flattenTraits = traits =>
  traits.toArray().map(trait => trait.map(t => t.toObject()));

const serialize = (result: Result) => ({
  ...result,
  userTraits: flattenTraits(result.userTraits),
  accountTraits: flattenTraits(result.accountTraits),
  userAliases: flattenAliases(result.userAliases),
  accountAliases: flattenAliases(result.accountAliases),
  accountLinks: Array.from(result.accountLinks)
});

export default serialize;

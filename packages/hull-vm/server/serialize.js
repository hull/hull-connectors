// @flow
import type { Result } from "../types";

const flattenAliases = aliases => {
  return Array.from(aliases).map(([claims, aa]) => [claims, Array.from(aa)]);
};

const serialize = (result: Result) => ({
  ...result,
  userTraits: result.userTraits.toArray(),
  accountTraits: result.accountTraits.toArray(),
  userAliases: flattenAliases(result.userAliases),
  accountAliases: flattenAliases(result.accountAliases),
  accountLinks: Array.from(result.accountLinks)
});

export default serialize;

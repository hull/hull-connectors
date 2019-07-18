// @flow
import type { Result } from "../types";

const serialize = (result: Result) => ({
  ...result,
  userTraits: Array.from(result.userTraits),
  accountTraits: Array.from(result.accountTraits),
  accountLinks: Array.from(result.accountLinks)
});

export default serialize;

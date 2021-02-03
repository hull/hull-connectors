// @flow

import _ from "lodash";
import type { HullEntityClaims, HullEntityName } from "../../types";

const ID = ["id"];
const EXTERNAL_ID = ["external_id.raw"];
const ANONYMOUS_ID = ["anonymous_ids.raw"];
const EMAIL = ["email", "email.exact", "contact_email", "contact_email.exact"];
const DOMAIN = ["domain", "domain.exact"];
const NAME = ["name", "name.exact"];
const ACCOUNT_SEARCH = [
  ...ID,
  ...NAME,
  ...DOMAIN,
  ...EXTERNAL_ID,
  ...ANONYMOUS_ID
];
const USER_SEARCH = [...ID, ...NAME, ...EMAIL, ...EXTERNAL_ID, ...ANONYMOUS_ID];
const TERMS = {
  email: EMAIL,
  domain: DOMAIN,
  external_id: EXTERNAL_ID,
  anonymous_id: ANONYMOUS_ID
};

type Lookup = { term: { [string]: string } };
type Condition = { bool: { ["should" | "filter"]: Array<Lookup | Condition> } };
type Options = { page?: number, per_page?: number, include?: Array<string> };

export const condition = (
  verb: string,
  predicates: Array<Lookup | Condition>
) => ({ bool: { [verb]: predicates } });

export const query = (
  verb: string,
  terms: Array<Lookup | Condition>,
  { page = 1, per_page = 1, include }: Options
) =>
  verb && _.size(terms)
    ? {
        query: condition(verb, terms),
        raw: true,
        ...(include ? { include } : {}),
        page,
        per_page
      }
    : undefined;

const getTerms = (claims?: HullEntityClaims = {}): Array<Lookup | Condition> =>
  _.reduce(
    claims,
    (filters, value, claim: string) => {
      if (!TERMS[claim]) {
        return filters;
      }
      const tt = TERMS[claim].map(term => ({ term: { [term]: value } }));
      filters.push(tt.length === 1 ? _.first(tt) : condition("should", tt));
      return filters;
    },
    []
  );
const getSearches = (term, lookups) =>
  lookups.map(l => ({ term: { [l]: term } }));

const getQuery = ({
  claims,
  entity,
  options,
  search
}: {
  claims?: HullEntityClaims,
  search?: string,
  entity: HullEntityName,
  options: Options
}) =>
  search === undefined
    ? query("filter", getTerms(claims), options)
    : query(
        "should",
        getSearches(search, entity === "user" ? USER_SEARCH : ACCOUNT_SEARCH),
        options
      );
export default getQuery;

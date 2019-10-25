// @flow

import _ from "lodash";
import type { HullEntityClaims, HullEntityType } from "../../types";

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

type Lookups = {
  term: {
    [string]: string
  }
};

type Options = {
  page?: number,
  per_page?: number,
  include?: Array<string>
};

export const query = (
  verb: string,
  terms: Array<Lookups>,
  { page = 1, per_page = 1, include }: Options
) =>
  verb && _.size(terms)
    ? {
        query: {
          bool: {
            [verb]: terms,
            minimum_should_match: 1
          }
        },
        raw: true,
        ...(include ? { include } : {}),
        page,
        per_page
      }
    : undefined;

const TERMS = {
  email: EMAIL,
  domain: DOMAIN,
  external_id: EXTERNAL_ID,
  anonymous_id: ANONYMOUS_ID
};

const getSearches = (term, lookups) =>
  lookups.map(l => ({
    term: { [l]: term }
  }));

const getQuery = ({
  claims,
  entity,
  options,
  search
}: {
  claims?: HullEntityClaims,
  search?: string,
  entity: HullEntityType,
  options: Options
}) => {
  const terms = !search
    ? _.reduce(
        claims,
        (filters, value, claim: string) => {
          if (TERMS[claim]) {
            _.map(TERMS[claim], term =>
              filters.push({ term: { [term]: value } })
            );
          }
          return filters;
        },
        []
      )
    : getSearches(search, entity === "user" ? USER_SEARCH : ACCOUNT_SEARCH);
  return query(!search ? "filter" : "should", terms, options);
};
export default getQuery;

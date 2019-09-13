// @flow

import _ from "lodash";

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

type Filters = {
  prefix: {
    [string]: string
  }
};

const getLookups = (lookups: Array<string>, value?: string): Array<Lookups> =>
  lookups.map((key: string) => ({ term: { [key]: value } }));
const getFilters = (lookups: Array<string>, value?: string): Array<Filters> =>
  lookups.map((key: string) => ({ prefix: { [key]: value } }));

export const filter = (lookups: Array<string>) => (
  value?: string,
  _unused?: string
) => ({
  query: {
    constant_score: {
      query: { match_all: {} },
      filter: {
        and: {
          filters: getFilters(lookups, value)
        }
      }
    }
  },
  sort: { created_at: "desc" },
  raw: true,
  page: 1,
  per_page: 1
});
export const search = (lookups: Array<string>) => (
  value?: string,
  _unused?: string
) => ({
  query:
    value !== undefined
      ? {
          bool: {
            should: getLookups(lookups, value),
            minimum_should_match: 1
          }
        }
      : {
          match_all: {}
        },
  raw: true,
  page: 1,
  per_page: 1
});

const getUserSearchQuery = search(USER_SEARCH);
const getIdQuery = search(ID);
const getEmailQuery = search(EMAIL);
const getAccountSearchQuery = search(ACCOUNT_SEARCH);
const getDomainQuery = search(DOMAIN);
const getExternalIdQuery = search(EXTERNAL_ID);
const getAnonymousIdQuery = filter(ANONYMOUS_ID);
const getNameQuery = search(NAME);
const getServiceIdQuery = (value: string, service?: string = "") =>
  getAnonymousIdQuery(_.compact([service, value]).join(":"), service);

const queries = {
  user: getUserSearchQuery,
  account: getAccountSearchQuery,
  id: getIdQuery,
  email: getEmailQuery,
  domain: getDomainQuery,
  external_id: getExternalIdQuery,
  anonymous_id: getAnonymousIdQuery,
  name: getNameQuery,
  service_id: getServiceIdQuery
};

export default queries;

// @flow

const LOOKUPS = [
  "id",
  "name",
  "name.exact",
  "email",
  "email.exact",
  "contact_email",
  "contact_email.exact",
  "external_id.raw"
];
const getLookups = (value?: string) =>
  LOOKUPS.map((key: string) => ({ term: { [key]: value } }));

const getSearchQuery = (value?: string) => ({
  query:
    value !== undefined
      ? {
          bool: {
            should: getLookups(value),
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
export default getSearchQuery;

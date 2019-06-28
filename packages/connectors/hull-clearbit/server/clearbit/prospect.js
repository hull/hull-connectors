import Promise from "bluebird";
import _ from "lodash";
import { isInSegments, getDomain } from "./utils";
import excludes from "../excludes";

export async function shouldProspect(settings = {}, message = {}) {
  const { account = {}, user = {}, account_segments = [] } = message;
  const { prospect_account_segments = [] } = settings;
  const { lookup_domain = "domain" } = settings;

  if (!getDomain(account, user, lookup_domain)) {
    return { should: false, message: "Can't find a domain" };
  }

  if (!isInSegments(account_segments, prospect_account_segments)) {
    return {
      should: false,
      message: "Account isn't in any prospectable segment"
    };
  }

  // Don't prospect twice
  if (account["clearbit/prospected_at"]) {
    return {
      should: false,
      message: "We don't prospect the same domain twice"
    };
  }

  return { should: true };
}

/**
 * Check if we already have known users from that domain
 * or if we have enough revealed visitors to prospect
 * @param  {Object(user)} payload - Hull user object
 * @return {Promise -> Bool}
 */
export async function shouldProspectDomain({ domain, hull, settings }) {
  if (_.includes(excludes.domains, domain)) {
    return Promise.resolve({
      should: false,
      message:
        "We don't prospect excluded domains. See https://github.com/hull-ships/hull-clearbit/blob/master/server/excludes.js"
    });
  }

  return hull
    .post("search/user_reports", {
      query: {
        bool: {
          should: [
            { term: { "traits_clearbit_company/domain.exact": domain } },
            { term: { "account.domain.exact": domain } },
            { term: { "account.clearbit.domain.exact": domain } }
          ],
          minimum_should_match: 1
        }
      },
      aggs: {
        without_email: { missing: { field: "email" } },
        by_source: { terms: { field: "traits_clearbit/source.exact" } }
      },
      search_type: "count"
    })
    .then(({ /* pagination, */ aggregations }) => {
      // const { total } = pagination;
      const anonymous = aggregations.without_email.doc_count;
      const bySource = _.reduce(
        aggregations.by_source.buckets,
        (bs, bkt) => {
          return { ...bs, [bkt.key]: bkt.doc_count };
        },
        {}
      );

      // // Skip prospect if we have known users with that domain
      // if (total > 0 && total !== anonymous) {
      //   return { should: false, message: "We have known users in that domain" };
      // }

      // Prospect if at least one of those anonymous has been discovered
      // if (bySource.discover && bySource.discover > 0) {
      //   return { should: true };
      // }

      const min_contacts = settings.reveal_prospect_min_contacts || 0;

      if (
        min_contacts &&
        (bySource.reveal < min_contacts || anonymous < min_contacts)
      ) {
        return {
          should: false,
          message:
            "We are under the unique anonymous visitors threshold for prospecting"
        };
      }
      // Prospect if we have at least a given number of reveals.
      return { should: true };
    });
}

export function fetchProspects({ client, query }) {
  const {
    titles = [],
    domain,
    roles,
    seniorities,
    cities,
    states,
    countries,
    limit = 5
  } = query;

  // Allow prospecting even if no titles passed
  if (titles.length === 0) titles.push(null);

  const prospects = {};

  return Promise.mapSeries(titles, title => {
    const newLimit = limit - _.size(prospects);
    if (newLimit <= 0) return Promise.resolve(prospects);
    const params = _.omitBy(
      {
        domain,
        roles,
        seniorities,
        cities,
        states,
        countries,
        title,
        limit: newLimit,
        email: true
      },
      v => v === undefined || v === null
    );
    return client.prospect(params).then((results = []) => {
      results.forEach(p => {
        prospects[p.email] = p;
      });
    });
  }).then(() => ({ prospects, query }));
}

export function prospect({ settings, client, message }) {
  const { lookup_domain = "domain" } = settings;
  const { account, user = {} } = message;
  const query = {
    domain: getDomain(account, user, lookup_domain),
    limit: settings.prospect_limit_count,
    email: true
  };

  ["seniorities", "titles", "roles", "cities", "states", "countries"].forEach(
    k => {
      const filter = settings[`prospect_filter_${k}`];
      if (!_.isEmpty(filter)) {
        query[k] = filter;
      }
    }
  );

  return fetchProspects({ client, query });
}

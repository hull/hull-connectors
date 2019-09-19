// @flow
//
// Because we need MapSeries
import Promise from "bluebird";
import type { HullContext, HullAccountUpdateMessage } from "hull";
import _ from "lodash";
import Client from "./client";
import { isInSegments, getDomain, now } from "./utils";

import excludes from "../excludes";
import { saveProspect } from "../lib/side-effects";
import type {
  ClearbitPrivateSettings,
  ShouldAction,
  ClearbitProspectorQuery,
  ClearbitProspect
} from "../types";

export async function shouldProspect(
  ctx: HullContext,
  settings: ClearbitPrivateSettings,
  message: HullAccountUpdateMessage
): Promise<ShouldAction> {
  const { account, account_segments = [] } = message;
  const { prospect_account_segments = [] } = settings;
  const domain = getDomain(account);
  if (!domain) {
    return { should: false, message: "Can't find a domain" };
  }
  if (_.includes(excludes.domains, domain)) {
    return {
      should: false,
      message:
        "We don't prospect excluded domains. See https://github.com/hull-ships/hull-clearbit/blob/master/server/excludes.js"
    };
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

export async function performProspect({
  settings,
  client,
  message
}: {
  settings: any,
  client: Client,
  message: HullAccountUpdateMessage
}): Promise<{ prospect: ClearbitProspect, query: ClearbitProspectorQuery }> {
  try {
    const { account } = message;

    const query = {};
    ["seniorities", "roles", "cities", "states", "countries"].forEach(k => {
      const filter = settings[`prospect_filter_${k}`];
      if (!!filter && !_.isEmpty(filter) && !_.isUndefined(filter)) {
        query[k] = filter;
      }
    });

    const titles = settings.prospect_filter_titles || [null];
    const limit = settings.prospect_limit_count || 5;
    const domain = getDomain(account);
    // Allow prospecting even if no titles passed
    if (titles.length === 0) {
      titles.push(null);
    }
    const prospects = {};
    const responseQuery = { query, titles, domain, limit };
    await Promise.mapSeries(titles, async title => {
      const newLimit = limit - _.size(prospects);
      if (newLimit <= 0) return Promise.resolve(prospects);
      const { results } = await client.prospect({
        domain,
        title,
        limit: newLimit,
        ...query
      });
      if (!results) {
        throw new Error("No Results");
      }
      return results.forEach(p => {
        prospects[p.email] = p;
      });
    });
    return { prospects, query: responseQuery };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export const prospect = async (
  ctx: HullContext,
  message: HullAccountUpdateMessage = {}
) => {
  const { metric, client, connector } = ctx;
  const { account } = message;
  const { private_settings } = connector;

  const scope = client.asAccount(account);

  const logError = error => {
    scope.logger.info("outgoing.account.error", {
      errors: _.get(error, "message", error),
      method: "prospectUser"
    });
  };

  try {
    metric.increment("prospect");
    const { prospects, query } = await performProspect({
      message,
      client: new Client(ctx),
      settings: private_settings
    });
    const log = {
      source: "prospector",
      message: `Found ${_.size(prospects)} new Prospects`,
      ...query,
      prospects
    };

    scope.logger.info("outgoing.account.success", log);

    // If we're scoped as Hull (and not as a User)
    // - when coming from the Prospector UI, then we can't add Track & Traits.
    // if (scope.traits) {
    //   scope.traits({
    //     "clearbit/prospected_at": { value: now(), operation: "setIfNull" }
    //   });
    // }
    //
    // if (scope.track) {
    //   scope.track(
    //     "Clearbit Prospector Triggered",
    //     {
    //       ..._.mapKeys(query, (v, k) => `query_${k}`),
    //       found: _.size(prospects),
    //       emails: _.keys(prospects)
    //     },
    //     { ip: 0 }
    //   );
    // }
    return Promise.all(
      prospects.map(person => saveProspect(ctx, { account, person }))
    );
  } catch (err) {
    logError(err);
    return Promise.reject(err);
  }
};

/**
 * Check if we already have known users from that domain
 * or if we have enough revealed visitors to prospect
 * @param  {Object(user)} payload - Hull user object
 * @return {Promise -> Bool}
 */
// export async function shouldProspectDomain({ domain, hull, settings }) {
//   return hull
//     .post("search/user_reports", {
//       query: {
//         bool: {
//           should: [
//             { term: { "traits_clearbit_company/domain.exact": domain } },
//             { term: { "account.domain.exact": domain } },
//             { term: { "account.clearbit.domain.exact": domain } }
//           ],
//           minimum_should_match: 1
//         }
//       },
//       aggs: {
//         without_email: { missing: { field: "email" } },
//         by_source: { terms: { field: "traits_clearbit/source.exact" } }
//       },
//       search_type: "count"
//     })
//     .then(({ /* pagination, */ aggregations }) => {
//       // const { total } = pagination;
//       const anonymous = aggregations.without_email.doc_count;
//       const bySource = _.reduce(
//         aggregations.by_source.buckets,
//         (bs, bkt) => {
//           return { ...bs, [bkt.key]: bkt.doc_count };
//         },
//         {}
//       );
//
//       // // Skip prospect if we have known users with that domain
//       // if (total > 0 && total !== anonymous) {
//       //   return { should: false, message: "We have known users in that domain" };
//       // }
//
//       // Prospect if at least one of those anonymous has been discovered
//       // if (bySource.discover && bySource.discover > 0) {
//       //   return { should: true };
//       // }
//
//       const min_contacts = settings.reveal_prospect_min_contacts || 0;
//
//       if (
//         min_contacts &&
//         (bySource.reveal < min_contacts || anonymous < min_contacts)
//       ) {
//         return {
//           should: false,
//           message:
//             "We are under the unique anonymous visitors threshold for prospecting"
//         };
//       }
//       // Prospect if we have at least a given number of reveals.
//       return { should: true };
//     });
// }

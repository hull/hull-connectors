// @flow
//
// Because we need MapSeries
import Promise from "bluebird";
import type { HullContext, HullAccountUpdateMessage } from "hull";
import _ from "lodash";
import Client from "./client";
import { isInSegments, getDomain } from "../lib/utils";

import excludes from "../excludes";
import { saveProspect } from "../lib/side-effects";
import type {
  ClearbitConnectorSettings,
  ShouldAction,
  ClearbitProspectorQuery,
  ClearbitProspect
} from "../types";

export async function shouldProspect(
  ctx: HullContext,
  settings: ClearbitConnectorSettings,
  message: HullAccountUpdateMessage
): Promise<ShouldAction> {
  const { account, account_segments = [] } = message;
  const {
    prospect_account_segments = [],
    prospect_account_segments_exclusion = []
  } = settings;
  const domain = getDomain(account, settings);

  if (ctx.isBatch) {
    return {
      should: false,
      message: "Prospector doesn't work on Batch updates"
    };
  }

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
      message: "Account not in any Prospect segment whitelist"
    };
  }

  // Skip if no segments match
  if (isInSegments(account_segments, prospect_account_segments_exclusion)) {
    return {
      should: false,
      message: "Account in Prospect segment blacklist"
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
  ctx,
  settings,
  message
}: {
  settings: ClearbitConnectorSettings,
  ctx: HullContext,
  message: HullAccountUpdateMessage
}): Promise<{ prospect: ClearbitProspect, query: ClearbitProspectorQuery }> {
  try {
    const { account } = message;

    const query = {};
    ["seniorities", "titles", "roles", "cities", "states", "countries"].forEach(
      k => {
        const filter = settings[`prospect_filter_${k}`];
        if (!!filter && !_.isEmpty(filter) && !_.isUndefined(filter)) {
          query[k] = filter;
        }
      }
    );

    // const titles = settings.prospect_filter_titles || [null];
    const limit = settings.prospect_limit_count || 5;
    const domain = getDomain(account, settings);

    // Allow prospecting even if no titles passed
    // if (titles.length === 0) {
    //   titles.push(null);
    // }
    const prospects = {};
    const responseQuery = { query, domain, limit };
    const page_size = Math.min(limit, 20);
    const pages = Math.floor(limit / page_size);
    let lastResultsCount = page_size;
    const client = new Client(ctx);
    const resultsArray = await Promise.all(
      Promise.mapSeries(_.times(pages), async index => {
        // Early return if we had less results than the max. i.e. we won't get more
        if (lastResultsCount < page_size) {
          return [];
        }
        const { results } = await client.prospect({
          domain,
          page: index + 1,
          page_size,
          ..._.omit(query, "limit")
        });
        lastResultsCount = _.size(results);
        return results;
      })
    );

    _.flatten(resultsArray).forEach(p => {
      prospects[p.email] = p;
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
      ctx,
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
      _.map(prospects, person => saveProspect(ctx, { account, person }))
    );
  } catch (err) {
    logError(err);
    return Promise.reject(err);
  }
};

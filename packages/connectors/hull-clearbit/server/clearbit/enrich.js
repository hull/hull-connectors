// @flow
import _ from "lodash";
import moment from "moment";
import type {
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullContext
} from "hull";
import Client from "./client";
import { isInSegments, getDomain, getEmail } from "../lib/utils";

import { saveAccount, saveUser } from "../lib/side-effects";

import type {
  ShouldAction,
  ClearbitResult,
  ClearbitConnectorSettings
} from "../types";

/**
 * Check if an enrich call has been made in the last hour
 * and we are still waiting for the webhook to ping us
 * @param  {User} user - A User
 * @return {Boolean}
 */
function lookupIsPending(entity) {
  const fetched_at = entity["clearbit/fetched_at"];
  const one_hour_ago = moment().subtract(1, "hours");
  return fetched_at && moment(fetched_at).isAfter(one_hour_ago);
}

export const shouldEnrichUser = (
  ctx: HullContext,
  settings: ClearbitConnectorSettings,
  message: HullUserUpdateMessage
): ShouldAction => {
  const { user, segments = [] } = message;
  const {
    enrich_user_segments = [],
    enrich_user_segments_exclusion = [],
    enrich_refresh
  } = settings;

  if (!getEmail(user, settings)) {
    return {
      should: false,
      message: "Cannot Enrich because missing email"
    };
  }

  // Batches trigger enrichment no matter what
  if (!ctx.isBatch) {
    if (_.isEmpty(enrich_user_segments)) {
      return {
        should: false,
        message: "No enrich segments defined for User"
      };
    }
    if (!isInSegments(segments, enrich_user_segments)) {
      return {
        should: false,
        message: "Enrich Segments are defined but User isn't in any of them"
      };
    }
    if (isInSegments(segments, enrich_user_segments_exclusion)) {
      return {
        should: false,
        message: "User is in Enrichment blacklist"
      };
    }
    // Skip if we are waiting for the webhook
    if (lookupIsPending(user)) {
      return { should: false, message: "Waiting for webhook" };
    }

    // Skip if we have a Clearbit ID already
    // Disable so we can rely on Audience Segments
    // const clearbit_id = ctx.client.utils.claims.getServiceId("clearbit", user);
    // if (clearbit_id) {
    //   return { should: false, message: "Clearbit ID present" };
    // }
    // Skip if we have already tried enriching and we aren't on auto-refresh mode.
    if (!enrich_refresh && user["clearbit/enriched_at"]) {
      return {
        should: false,
        message: "enriched_at present and refresh disabled"
      };
    }
  }

  return { should: true };
};

/**
 * Check if we should Enrich the User (based on user data and ship configuration)
 * @param  {Message({ user, segments })} message - A user:update message
 * @return {Boolean}
 */
export function shouldEnrichAccount(
  ctx: HullContext,
  settings: ClearbitConnectorSettings,
  message: HullAccountUpdateMessage
): ShouldAction {
  const { account, account_segments = [] } = message;
  const {
    enrich_account_segments = [],
    enrich_account_segments_exclusion = []
  } = settings;

  if (!getDomain(account, settings)) {
    return {
      should: false,
      message: "Cannot Enrich because missing domain"
    };
  }

  // Batches trigger enrichment no matter what
  if (!ctx.isBatch) {
    if (_.isEmpty(enrich_account_segments)) {
      return {
        should: false,
        message: "No enrich segments defined for Account"
      };
    }

    // Skip if no segments match
    if (!isInSegments(account_segments, enrich_account_segments)) {
      return {
        should: false,
        message: "Enrich Segments are defined but Account isn't in any of them"
      };
    }

    if (isInSegments(account_segments, enrich_account_segments_exclusion)) {
      return {
        should: false,
        message: "Account is in Enrichment Blacklist"
      };
    }

    // Skip if we are waiting for the webhook
    if (lookupIsPending(account)) {
      return { should: false, message: "Waiting for webhook" };
    }

    // Skip if we have a Clearbit ID already
    const clearbit_id = ctx.client.utils.claims.getServiceId(
      "clearbit",
      account
    );
    if (clearbit_id) {
      return { should: false, message: "Clearbit ID present" };
    }

    // Skip if we have already tried enriching
    if (account["clearbit/enriched_at"]) {
      return { should: false, message: "enriched_at present" };
    }
  }

  return { should: true };
}

export async function performEnrich({
  ctx,
  token,
  settings,
  message,
  hostname
}: {
  ctx: HullContext,
  token: string,
  settings: ClearbitConnectorSettings,
  subscribe: boolean,
  hostname: string,
  message: HullUserUpdateMessage | HullAccountUpdateMessage
}) {
  const { user, account } = message;
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { enrich_refresh } = private_settings;
  const id = _.get(user, "id") || account.id;
  const payload =
    user && _.size(user)
      ? {
          email: getEmail(user, settings),
          given_name: user.first_name,
          family_name: user.last_name,
          webhook_url: undefined,
          webhook_id: id,
          subscribe: !!enrich_refresh
        }
      : {
          domain: getDomain(account, settings),
          company_name: account.name,
          webhook_url: undefined,
          webhook_id: id,
          subscribe: !!enrich_refresh
        };

  payload.webhook_url = `https://${hostname}/clearbit-enrich?token=${token}`;
  const enrich = await new Client(ctx).enrich(payload);
  return enrich || {};
}

export const enrich = async (
  ctx: HullContext,
  message: HullUserUpdateMessage | HullAccountUpdateMessage
): Promise<void | ClearbitResult> => {
  const { user, account } = message;
  const { hostname, metric, clientCredentialsEncryptedToken } = ctx;
  const { connector } = ctx;
  const { private_settings } = connector;
  try {
    metric.increment("enrich");
    const { person, company } = await performEnrich({
      ctx,
      settings: private_settings,
      token: clientCredentialsEncryptedToken,
      subscribe: true,
      hostname,
      message
    });
    if (!person && !company) {
      return undefined;
    }
    // if (!response || !response.source) return undefined;
    // const { person, company } = enrichment;
    await Promise.all([
      user && saveUser(ctx, { user, person, source: "enrich" }),
      account &&
        saveAccount(ctx, { user, person, account, company, source: "enrich" })
    ]);
  } catch (err) {
    throw err;
  }
  return undefined;
};

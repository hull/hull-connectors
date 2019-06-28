// @flow
import _ from "lodash";
import moment from "moment";
import type { HullUserUpdateMessage, HullAccountUpdateMessage } from "hull";
import { isInSegments, getDomain } from "./utils";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitPrivateSettings
} from "../types";

/**
 * Check if an enrich call has been made in the last hour
 * and we are still waiting for the webhook to ping us
 * @param  {User} user - A User
 * @return {Boolean}
 */
function lookupIsPending(entity) {
  const fetched_at =
    entity["traits_clearbit/fetched_at"] || entity["clearbit/fetched_at"];
  const one_hour_ago = moment().subtract(1, "hours");
  return fetched_at && moment(fetched_at).isAfter(one_hour_ago);
}

/**
 * Fetch data from Clearbit's Enrichment API
 */
function fetchFromEnrich({ settings, client, token, message, hostname }) {
  const { lookup_domain = "domain", stream } = settings;
  const { user = {}, account } = message;
  const domain = getDomain(account, user, lookup_domain);

  const payload = _.size(user)
    ? {
        email: user.email,
        given_name: user.first_name,
        family_name: user.last_name,
        stream
      }
    : {
        domain,
        company_name: account.name,
        stream
      };

  const id = user.id || account.id;

  // if (hostname) {
  payload.webhook_url = `https://${hostname}/clearbit-enrich/${token}`;
  // }

  if (!stream) {
    payload.webhook_id = id;
  }

  return client.enrich(payload);
}

/**
 * Check if we can Enrich the User (based on user data and ship configuration)
 * @param  {User({ email })} user - A user profile
 * @return {Boolean}
 */
export function canEnrich(
  settings: ClearbitPrivateSettings,
  message: HullUserUpdateMessage | HullAccountUpdateMessage
): boolean {
  const { lookup_domain = "domain" } = settings;
  // Merge enrich and prospect segments lists
  // To check if the user matches one of them
  const { user, account } = message;
  if (user) {
    return !_.isEmpty(user.email);
  }
  if (account) {
    return !_.isEmpty(getDomain(account, user, lookup_domain));
  }
  return false;
}

/**
 * Check if we should Enrich the User (based on user data and ship configuration)
 * @param  {Message({ user, segments })} message - A user:update message
 * @return {Boolean}
 */
export function shouldEnrich(
  settings: ClearbitPrivateSettings,
  message: HullUserUpdateMessage | HullAccountUpdateMessage
): ShouldAction {
  const { user, account, segments = [], account_segments = [] } = message;
  const { enrich_account_segments = [], enrich_user_segments = [] } = settings;

  if (!canEnrich(settings, message)) {
    return {
      should: false,
      message: "Cannot Enrich because missing email or domain"
    };
  }

  if (user) {
    if (_.isEmpty(enrich_user_segments)) {
      return {
        should: false,
        message: "No enrich segments defined for User"
      };
    }

    // Skip if no segments match
    if (!isInSegments(segments, enrich_user_segments)) {
      return {
        should: false,
        message: "Enrich Segments are defined but User isn't in any of them"
      };
    }

    // Skip if we are waiting for the webhook
    if (lookupIsPending(user)) {
      return { should: false, message: "Waiting for webhook" };
    }

    // Skip if we have a Clearbit ID already
    if (user["traits_clearbit/id"]) {
      return { should: false, message: "Clearbit ID present" };
    }

    // Skip if we have already tried enriching
    if (user["traits_clearbit/enriched_at"]) {
      return { should: false, message: "enriched_at present" };
    }

    return { should: true };
  }

  if (account) {
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

    // Skip if we are waiting for the webhook
    if (lookupIsPending(account)) {
      return { should: false, message: "Waiting for webhook" };
    }

    // Skip if we have a Clearbit ID already
    if (account["clearbit/id"]) {
      return { should: false, message: "Clearbit ID present" };
    }

    // Skip if we have already tried enriching
    if (account["clearbit/enriched_at"]) {
      return { should: false, message: "enriched_at present" };
    }

    return { should: true };
  }

  return { should: false, message: "Can't find a User or Account to enrich" };
}

export async function enrich(params): ClearbitResult {
  const enrichment = await fetchFromEnrich(params);
  return {
    ...enrichment,
    source: "enrich"
  };
}

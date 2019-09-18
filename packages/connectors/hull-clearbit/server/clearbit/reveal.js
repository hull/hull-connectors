import _ from "lodash";
import { isInSegments, isValidIpAddress } from "./utils";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitPrivateSettings
} from "../types";

/**
 * Checks if the user fullfills the right conditions to be revealed.
 * @param  {User({ last_known_ip, email })} user - A user profile
 * @return {Boolean}
 */
export function canReveal(settings, message = {}) {
  const { user } = message;
  if (!user) {
    return false;
  }
  return isValidIpAddress(user.last_known_ip);
}

/**
 * Check if we should Reveal the User (based on user data and ship configuration)
 * @param  {Message({ user, segments })} message - A user:update message
 * @return {Boolean}
 */
export function shouldReveal(
  settings: ClearbitPrivateSettings,
  message: HullUserUpdateMessage
): ShouldAction {
  const { user, account = {}, segments = [] } = message;
  const { reveal_segments = [] } = settings;

  if (!canReveal(settings, message)) {
    return {
      should: false,
      message: "Cannot reveal because missing IP"
    };
  }

  // Skip if reveal is disabled
  if (_.isEmpty(reveal_segments)) {
    return { should: false, message: "No reveal Segments enabled" };
  }

  // Skip if no segments match
  if (!isInSegments(segments, reveal_segments)) {
    return {
      should: false,
      message: "Reveal segments are defined but user isn't in any of them"
    };
  }

  // Skip if clearbit company already set on account
  if (account["clearbit/id"]) {
    return { should: false, message: "Clearbit Company ID present on Account" };
  }

  // Skip if user has been enriched
  // if (user["traits_clearbit/enriched_at"]) {
  //   return { should: false, message: "enriched_at present" };
  // }

  // Skip if user has been revealed
  if (user["traits_clearbit/revealed_at"]) {
    return { should: false, message: "revealed_at present" };
  }

  return { should: true };
}

export async function reveal({ client, message }) {
  const { user } = message;
  const { last_known_ip: ip } = user;
  const response = await client.reveal({ ip });
  return {
    ...response,
    source: "reveal",
    ip
  };
}

// @flow
import _ from "lodash";
import type { HullUserUpdateMessage, HullContext } from "hull";
import { isInSegments, isValidIpAddress } from "./utils";
import type Client from "./client";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitPrivateSettings
} from "../types";

/**
 * Check if we should Reveal the User (based on user data and ship configuration)
 * @param  {Message({ user, segments })} message - A user:update message
 * @return {Boolean}
 */
export function shouldReveal(
  ctx: HullContext,
  settings: ClearbitPrivateSettings,
  message: HullUserUpdateMessage
): ShouldAction {
  const { user, account, segments = [] } = message;
  const { reveal_segments = [] } = settings;

  // Skip if reveal is disabled
  if (_.isEmpty(reveal_segments)) {
    return { should: false, message: "No reveal Segments enabled" };
  }

  if (!isValidIpAddress(user.last_known_ip)) {
    return {
      should: false,
      message: "Cannot reveal because missing IP"
    };
  }

  // Skip if no segments match
  if (!isInSegments(segments, reveal_segments)) {
    return {
      should: false,
      message: "Reveal segments are defined but user isn't in any of them"
    };
  }

  // Skip if clearbit company already set on account
  const clearbit_id = ctx.client.utils.claims.getService("clearbit", account);
  if (clearbit_id) {
    return { should: false, message: "Clearbit Company ID present on Account" };
  }

  // Skip if user has been revealed
  if (user["clearbit/revealed_at"]) {
    return { should: false, message: "revealed_at present" };
  }

  return { should: true };
}

export async function reveal({
  client,
  message
}: {
  client: Client,
  message: HullUserUpdateMessage
}): Promise<ClearbitResult> {
  const { user } = message;
  const { last_known_ip: ip } = user;
  const response: ClearbitResult = await client.reveal({ ip });
  return {
    ...response,
    source: "reveal",
    ip
  };
}

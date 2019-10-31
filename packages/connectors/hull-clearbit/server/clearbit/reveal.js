// @flow
import _ from "lodash";
import type { HullUserUpdateMessage, HullContext } from "hull";
import { isInSegments, isValidIpAddress } from "../lib/utils";
import Client from "./client";
import { saveAccount, saveUser } from "../lib/side-effects";
import type {
  ShouldAction,
  ClearbitRevealResponse,
  ClearbitConnectorSettings
} from "../types";

/**
 * Check if we should Reveal the User (based on user data and ship configuration)
 * @param  {Message({ user, segments })} message - A user:update message
 * @return {Boolean}
 */
export function shouldReveal(
  ctx: HullContext,
  settings: ClearbitConnectorSettings,
  message: HullUserUpdateMessage
): ShouldAction {
  const { user, account, segments = [] } = message;
  const {
    reveal_user_segments = [],
    reveal_user_segments_exclusion = []
  } = settings;

  if (ctx.isBatch) {
    return {
      should: false,
      message: "Reveal doesn't work on Batch updates"
    };
  }

  // Skip if reveal is disabled
  if (_.isEmpty(reveal_user_segments)) {
    return { should: false, message: "No reveal Segments enabled" };
  }

  if (!isValidIpAddress(user.last_known_ip)) {
    return {
      should: false,
      message: "Cannot reveal because missing IP"
    };
  }

  // Skip if no segments match
  if (!isInSegments(segments, reveal_user_segments)) {
    return {
      should: false,
      message: "User not in any Reveal segment whitelist"
    };
  }

  // Skip if no segments match
  if (isInSegments(segments, reveal_user_segments_exclusion)) {
    return {
      should: false,
      message: "User in Reveal segment blacklist"
    };
  }

  // Skip if clearbit company already set on account
  const clearbit_id = ctx.client.utils.claims.getServiceId("clearbit", account);
  if (clearbit_id) {
    return { should: false, message: "Clearbit Company ID present on Account" };
  }

  // Skip if user has been revealed
  if (user["clearbit/revealed_at"]) {
    return { should: false, message: "revealed_at present" };
  }

  return { should: true };
}

export async function performReveal({
  ctx,
  message
}: {
  ctx: HullContext,
  message: HullUserUpdateMessage
}) {
  const { user } = message;
  const { last_known_ip: ip } = user;
  const response: void | ClearbitRevealResponse = await new Client(ctx).reveal({
    ip
  });
  return {
    company: undefined,
    ...(response || {}),
    source: "reveal",
    ip
  };
}

export const reveal = async (
  ctx: HullContext,
  message: HullUserUpdateMessage
) => {
  const { user, account } = message;
  const { metric, client } = ctx;

  const asUser = client.asUser(user);
  try {
    metric.increment("reveal");
    const response = await performReveal({
      ctx,
      message
    });
    if (!response || !response.source) return false;
    const { company, source, ip } = response;
    if (company) {
      await Promise.all([
        saveUser(ctx, { user, source }),
        saveAccount(
          ctx,
          { account, user, company, source },
          {
            company: _.pick(company, "name", "domain"),
            ip
          }
        )
      ]);
    }
  } catch (err) {
    // we filter error messages
    if (!_.includes(["unknown_ip"], err.type)) {
      asUser.logger.info("outgoing.user.error", {
        errors: err,
        method: "revealUser"
      });
    }
    throw err;
  }
  return undefined;
};

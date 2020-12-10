// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import { ConfigurationError } from "hull/src/errors";
import { updateUser, enrichUser } from "../lib/side-effects";

const hasEmail = ({ user: { email } }: HullUserUpdateMessage) => !!email;

export default async function userUpdate(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
) {
  const {
    helpers,
    connector: {
      private_settings: {
        enriched_user_segments,
        enriched_user_segments_exclusion,
        synchronized_user_segments,
        synchronized_user_segments_exclusion,
        api_key
      }
    }
  } = ctx;

  if (!api_key) {
    throw new ConfigurationError("No API Key available");
  }

  const { hasMatchingSegments } = helpers;
  const matchesUpdateSegments = hasMatchingSegments({
    matchOnBatch: true,
    entity: "user",
    whitelist: synchronized_user_segments,
    blacklist: synchronized_user_segments_exclusion
  });
  const matchesEnrichSegments = hasMatchingSegments({
    matchOnBatch: true,
    entity: "user",
    whitelist: enriched_user_segments,
    blacklist: enriched_user_segments_exclusion
  });

  await Promise.all([
    ...messages.filter(matchesUpdateSegments).map(updateUser(ctx)),
    ...messages
      .filter(hasEmail)
      .filter(matchesEnrichSegments)
      .map(enrichUser(ctx))
  ]);
  return true;
}

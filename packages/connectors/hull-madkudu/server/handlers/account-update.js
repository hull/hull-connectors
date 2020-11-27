// @flow

import type { HullContext, HullAccountUpdateMessage } from "hull";
import { enrichAccount } from "../lib/side-effects";

const hasDomain = ({ account: { domain } }: HullAccountUpdateMessage) =>
  !!domain;

export default async function accountUpdate(
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
) {
  const {
    helpers,
    connector: {
      private_settings: {
        enriched_account_segments,
        enriched_account_segments_exclusion,
        api_key
      }
    }
  } = ctx;

  if (!api_key) {
    throw new Error("No API Key available");
  }

  const { hasMatchingSegments } = helpers;
  const matchesSegments = hasMatchingSegments({
    matchOnBatch: true,
    entity: "account",
    whitelist: enriched_account_segments,
    blacklist: enriched_account_segments_exclusion
  });

  await Promise.all(
    messages
      .filter(hasDomain)
      .filter(matchesSegments)
      .map(enrichAccount(ctx))
  );
  return true;
}

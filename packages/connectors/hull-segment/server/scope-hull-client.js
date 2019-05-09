// @flow

const EMAIL_REGEXP = /([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})/i;

import type { HullClient, HullUser, HullAdditionalClaims } from "hull";
import type { SegmentConnector, SegmentIncomingPayload } from "./types";

/**
 * Prepares a scoped hull-client-node to provided user object
 * @param  {Object} hull hull client instance
 * @param  {Object} user hull user object
 * @param  {Object} settings connector settings - req.hull.ship
 * @param  {Object} additionalClaims optional claims
 * @return {Object} scoped client instance
 */
export default function scope(
  client: HullClient,
  payload: SegmentIncomingPayload,
  useHullId: boolean,
  settings: $PropertyType<SegmentConnector, "settings">,
  additionalClaims: HullAdditionalClaims
) {
  const { userId, anonymousId, traits = {} } = payload;
  if (!userId && !anonymousId) {
    throw new Error("Can't find any identifier for the current user");
  }

  const claims = {};

  // Allow to ignore segment's userId altogether
  // via the `ignore_segment_userId` setting.
  if (userId && settings.ignore_segment_userId !== true) {
    claims[useHullId ? "id" : "external_id"] = userId;
  }

  if (traits.email && EMAIL_REGEXP.test(traits.email)) {
    claims.email = traits.email.toLowerCase();
  }

  if (anonymousId) {
    claims.anonymous_id = anonymousId;
  }

  return client.asUser(claims, additionalClaims);
}

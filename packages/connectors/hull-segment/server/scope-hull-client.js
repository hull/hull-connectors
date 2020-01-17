// @flow
import _ from "lodash";
import type { HullClient, HullAdditionalClaims } from "hull";
import type { SegmentConnectorSettings, SegmentIncomingPayload } from "./types";

const EMAIL_REGEXP = /([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})/i;

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
  message: SegmentIncomingPayload,
  {
    ignore_segment_userId
  }: $PropertyType<SegmentConnectorSettings, "settings">,
  additionalClaims: HullAdditionalClaims
) {
  const { integrations, userId, anonymousId, traits = {} } = message;
  const { email } = traits || {};
  const useHullId = integrations.Hull && integrations.Hull.id === true;

  const claims = {};

  if (!userId && !anonymousId && !email) {
    throw new Error("No user ID or anonymous ID present.");
  }

  if (ignore_segment_userId === true && !email && !anonymousId) {
    throw new Error(
      "No email address or anonymous ID present when ignoring segment's user ID."
    );
  }

  // Allow to ignore segment's userId altogether
  // via the `ignore_segment_userId` setting.
  if (userId && ignore_segment_userId !== true) {
    claims[useHullId ? "id" : "external_id"] = userId;
  }

  if (traits.email && EMAIL_REGEXP.test(traits.email)) {
    claims.email = traits.email.toLowerCase();
  }

  if (anonymousId) {
    claims.anonymous_id = anonymousId;
  }

  if (!_.size(claims)) {
    throw new Error("No claims found to resolve message");
  }

  return client.asUser(claims, additionalClaims);
}

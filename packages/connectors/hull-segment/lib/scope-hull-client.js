"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = scope;
const EMAIL_REGEXP = /([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})/i;
/**
 * Prepares a scoped hull-client-node to provided user object
 * @param  {Object} hull hull client instance
 * @param  {Object} user hull user object
 * @param  {Object} settings connector settings - req.hull.ship
 * @param  {Object} additionalClaims optional claims
 * @return {Object} scoped client instance
 */

function scope(hull, user = {}, settings, additionalClaims = {}) {
  const hullId = user.hullId,
        userId = user.userId,
        anonymousId = user.anonymousId,
        _user$traits = user.traits,
        traits = _user$traits === void 0 ? {} : _user$traits;

  if (!hullId && !userId && !anonymousId) {
    return hull;
  }

  const as = {}; // Allow to ignore segment's userId altogether
  // via the `ignore_segment_userId` setting.

  if (settings.ignore_segment_userId !== true) {
    if (hullId || userId) {
      if (hullId) {
        as.id = hullId;
      }

      if (userId) {
        as.external_id = userId;
      }
    }
  }

  if (traits.email && EMAIL_REGEXP.test(traits.email)) {
    as.email = traits.email.toLowerCase();
  }

  if (anonymousId) {
    as.anonymous_id = anonymousId;
  }

  return hull.asUser(as, additionalClaims);
}
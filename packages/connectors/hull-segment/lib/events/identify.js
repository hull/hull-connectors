"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handleIdentify;

var _lodash = require("lodash");

var _scopeHullClient = _interopRequireDefault(require("../scope-hull-client"));

const ALIASED_FIELDS = {
  lastname: "last_name",
  firstname: "first_name",
  createdat: "created_at"
};
const IGNORED_TRAITS = ["id", "external_id", "guest_id", "uniqToken", "visitToken"];

function updateUser(hull, user, shipSettings, active) {
  try {
    const userId = user.userId,
          anonymousId = user.anonymousId,
          _user$traits = user.traits,
          traits = _user$traits === void 0 ? {} : _user$traits;

    const _ref = traits || {},
          email = _ref.email;

    const asUser = hull.asUser({
      external_id: userId,
      email,
      anonymous_id: anonymousId
    });

    if (shipSettings.ignore_segment_userId === true && !email && !anonymousId) {
      const logPayload = {
        id: user.id,
        anonymousId,
        email
      };
      asUser.logger.debug("incoming.user.skip", {
        reason: "No email address or anonymous ID present when ignoring segment's user ID.",
        logPayload
      });
      return Promise.resolve({
        skip: true
      });
    } else if (!userId && !anonymousId) {
      const logPayload = {
        id: user.id,
        userId,
        anonymousId
      };
      asUser.logger.debug("incoming.user.skip", {
        reason: "No user ID or anonymous ID present.",
        logPayload
      });
      return Promise.resolve({
        skip: true
      });
    }

    return (0, _scopeHullClient.default)(hull, user, shipSettings, {
      active
    }).traits(traits).then(() => (
    /* response */
    {
      skip: false,
      traits
    }), error => {
      error.params = traits;
      throw error;
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

function handleIdentify(payload, {
  hull,
  metric,
  ship
}) {
  const context = payload.context,
        traits = payload.traits,
        userId = payload.userId,
        anonymousId = payload.anonymousId,
        _payload$integrations = payload.integrations,
        integrations = _payload$integrations === void 0 ? {} : _payload$integrations;

  const _ref2 = context || {},
        _ref2$active = _ref2.active,
        active = _ref2$active === void 0 ? false : _ref2$active;

  const user = (0, _lodash.reduce)(traits || {}, (u, v, k) => {
    if (v == null) return u;

    if (ALIASED_FIELDS[k.toLowerCase()]) {
      u.traits[ALIASED_FIELDS[k.toLowerCase()]] = v;
    } else if (!(0, _lodash.includes)(IGNORED_TRAITS, k)) {
      u.traits[k] = v;
    }

    return u;
  }, {
    userId,
    anonymousId,
    traits: {}
  });

  if (integrations.Hull && integrations.Hull.id === true) {
    user.hullId = user.userId;
    delete user.userId;
  }

  if (!(0, _lodash.isEmpty)(user.traits)) {
    const updating = updateUser(hull, user, ship.settings, active);
    updating.then(({
      skip = false,
      traits: t = {}
    }) => {
      metric("request.identify.updateUser");
      const scopedClient = hull.asUser({
        email: t.email,
        external_id: userId,
        anonymous_id: anonymousId
      });
      scopedClient.logger.debug(`incoming.user.${skip ? "skip" : "success"}`, {
        payload,
        traits: t
      });

      try {
        const topLevelEmail = payload.email;

        if (topLevelEmail) {
          scopedClient.logger.debug(`Contains a top level email in identify call: ${topLevelEmail}`);
        }
      } catch (error) {
        console.log(`Error logging toplevel email ${payload.email}`);
      }
    }, error => {
      metric("request.identify.updateUser.error");
      hull.asUser({
        external_id: userId,
        anonymous_id: anonymousId
      }).logger.error("incoming.user.error", {
        payload,
        errors: error
      });
    });
    return updating;
  }

  return user;
}
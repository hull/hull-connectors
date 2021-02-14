"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = updateUserFactory;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function updateUserFactory(analyticsClient) {
  return function updateUser({
    message = {}
  }, {
    ship = {},
    hull = {},
    ignoreFilters = false
  }) {
    const _message$user = message.user,
          user = _message$user === void 0 ? {} : _message$user,
          _message$segments = message.segments,
          segments = _message$segments === void 0 ? [] : _message$segments,
          _message$events = message.events,
          events = _message$events === void 0 ? [] : _message$events,
          _message$account_segm = message.account_segments,
          account_segments = _message$account_segm === void 0 ? [] : _message$account_segm,
          _message$changes = message.changes,
          changes = _message$changes === void 0 ? {} : _message$changes;
    const account = message.account || user.account; // Empty payload ?

    if (!user.id || !ship.id) {
      return false;
    }

    const asUser = hull.asUser(_lodash.default.pick(user, ["email", "id", "external_id"])); // Custom properties to be synchronized

    const _ref = ship.private_settings || {},
          _ref$synchronized_pro = _ref.synchronized_properties,
          synchronized_properties = _ref$synchronized_pro === void 0 ? [] : _ref$synchronized_pro,
          _ref$synchronized_seg = _ref.synchronized_segments,
          synchronized_segments = _ref$synchronized_seg === void 0 ? [] : _ref$synchronized_seg,
          _ref$synchronized_acc = _ref.synchronized_account_properties,
          synchronized_account_properties = _ref$synchronized_acc === void 0 ? [] : _ref$synchronized_acc,
          _ref$forward_events = _ref.forward_events,
          forward_events = _ref$forward_events === void 0 ? false : _ref$forward_events,
          _ref$send_events = _ref.send_events,
          send_events = _ref$send_events === void 0 ? [] : _ref$send_events; // Build traits that will be sent to Segment
    // Use hull_segments by default


    const traits = {
      hull_segments: _lodash.default.map(segments, "name")
    };

    if (synchronized_properties.length > 0) {
      synchronized_properties.map(prop => {
        if (prop.indexOf("account.") === 0) {
          const t = prop.replace(/^account\./, "");
          traits[`account_${t.replace("/", "_")}`] = _lodash.default.get(account, t);
        } else {
          traits[prop.replace(/^traits_/, "").replace("/", "_")] = _lodash.default.get(user, prop);
        }

        return true;
      });
    } // Configure Analytics.js with write key
    // Ignore if write_key is not present


    const _ref2 = ship.settings || {},
          write_key = _ref2.write_key,
          handle_groups = _ref2.handle_groups,
          handle_accounts = _ref2.handle_accounts,
          public_id_field = _ref2.public_id_field,
          public_account_id_field = _ref2.public_account_id_field;

    if (!write_key) {
      return false;
    }

    const analytics = analyticsClient(write_key); // Look for an anonymousId
    // if we have events in the payload, we take the annymousId of the first event
    // Otherwise, we look for known anonymousIds attached to the user and we take the last one

    let anonymousId;

    if (events && events.length > 0 && events[0].anonymous_id) {
      anonymousId = events[0].anonymous_id;
    } else if (user.anonymous_ids && user.anonymous_ids.length) {
      anonymousId = _lodash.default.first(user.anonymous_ids);
    }

    let publicIdField = "external_id";

    if (public_id_field) {
      publicIdField = public_id_field;
    }

    const userId = user[publicIdField];
    const groupId = user["traits_group/id"];
    const publicAccountIdField = public_account_id_field === "id" ? "id" : "external_id";
    const accountId = account && account[publicAccountIdField]; // We have no identifier for the user, we have to skip

    if (!userId && !anonymousId) {
      asUser.logger.debug("outgoing.user.skip", {
        reason: "No Identifier (userId or anonymousId)",
        traits
      });
      return false;
    }

    const changedUserAttributes = _lodash.default.keys(_lodash.default.get(changes, "user", {}));

    const changedAccountAttributes = _lodash.default.keys(_lodash.default.get(changes, "account", {}));

    const libraryOverride = _lodash.default.get(ship, "private_settings.context_library", null);

    const integrations = {
      Hull: false
    };
    const context = {
      active: false,
      ip: 0
    };
    let ret = false;

    if (libraryOverride !== null) {
      try {
        const library = JSON.parse(libraryOverride);

        if (!_lodash.default.has(library, "name") || !_lodash.default.has(library, "version")) {
          hull.logger.debug("meta.library.invalid", "Library information is missing name or version.");
        } else {
          _lodash.default.set(context, "library", library);
        }
      } catch (error) {
        // We failed to parse the library info, so just move on with the default.
        hull.logger.debug("meta.library.failed", JSON.stringify(error));
      }
    }

    const segment_ids = _lodash.default.map(segments, "id"); // only potentially skip if we are NOT ignoring filters
    // if we ARE ignoring filters, then don't skip ever


    if (!ignoreFilters) {
      // if this user does not belong to any of the synchronized segments
      // then we want to skip
      if (_lodash.default.intersection(segment_ids, synchronized_segments).length === 0) {
        // Finally check to see if any of the synchronized segments is the "ALL"
        // if if it's not one of the segments, then skip it
        if (_lodash.default.indexOf(synchronized_segments, "ALL") < 0) {
          asUser.logger.debug("outgoing.user.skip", {
            reason: "not matching any segment",
            segment_ids,
            traits
          });
          return false;
        }
      }
    }
    /**
     * ignoreFilters is a special boolean which is set on BATCH notifications
     * for batch notifications we do NOT want to filter, which is why it is used
     * in this case to bypass all the segment filtering
     */


    if (!_lodash.default.isEmpty(_lodash.default.get(changes, "segments", {})) || _lodash.default.intersection(synchronized_properties, changedUserAttributes).length > 0 || !_lodash.default.isEmpty(_lodash.default.get(changes, "account_segments", {})) || _lodash.default.intersection(synchronized_account_properties, changedAccountAttributes).length > 0 || ignoreFilters === true) {
      try {
        // Add group if available
        if (handle_groups && groupId && userId) {
          context.groupId = groupId;

          const groupTraits = _lodash.default.reduce(user, (group, value, key) => {
            const mk = key.match(/^traits_group\/(.*)/);
            const groupKey = mk && mk[1];

            if (groupKey && groupKey !== "id") {
              group[groupKey] = value;
            }

            return group;
          }, {}); // ignoreFilters is checked in this case because of a limitation in the platform
          // the platform doesn't send account segments for user updates
          // So do not put it in, otherwise will blank out hull segment trait on the other side


          if (!ignoreFilters) {
            // Add account segments
            _lodash.default.set(groupTraits, "hull_segments", _lodash.default.map(account_segments, "name"));
          }

          if (!_lodash.default.isEmpty(groupTraits)) {
            asUser.logger.info("outgoing.group.success", {
              groupId,
              traits: groupTraits,
              context
            });
            analytics.group({
              groupId,
              anonymousId,
              userId,
              traits: groupTraits,
              context,
              integrations
            });
          }
        } else if (handle_accounts && accountId) {
          const accountTraits = synchronized_account_properties.map(k => k.replace(/^account\./, "")).reduce((props, prop) => {
            props[prop.replace("/", "_")] = account[prop];
            return props;
          }, {}); // Please see comment above for why we only set this on !ignoreFilters

          if (!ignoreFilters) {
            // Add account segments
            _lodash.default.set(accountTraits, "hull_segments", _lodash.default.map(account_segments, "name"));
          }

          if (!_lodash.default.isEmpty(accountTraits)) {
            hull.logger.debug("group.send", {
              groupId: accountId,
              traits: accountTraits,
              context
            });
            analytics.group({
              groupId: accountId,
              anonymousId,
              userId,
              traits: accountTraits,
              context,
              integrations
            });
            asUser.account().logger.info("outgoing.account.success", {
              groupId: accountId,
              traits: accountTraits,
              context
            });
          } else {
            asUser.account().logger.debug("outgoing.account.skip", {
              reason: "Empty traits payload",
              groupId: accountId,
              traits: accountTraits,
              context
            });
          }
        } else {
          asUser.account().logger.debug("outgoing.account.skip", {
            reason: "doesn't match rules for sending",
            handle_groups,
            handle_accounts,
            groupId,
            accountId,
            publicAccountIdField
          });
        }
      } catch (err) {
        console.warn("Error processing group update", err);
      }

      ret = analytics.identify({
        anonymousId,
        userId,
        traits,
        context,
        integrations
      });
      asUser.logger.info("outgoing.user.success", {
        userId,
        traits
      });
    } else {
      asUser.logger.debug("outgoing.user.skip", {
        reason: "No changes detected that would require a synchronization to segment.com"
      });
      ret = false;
    }

    if (events && events.length > 0) {
      events.map(e => {
        // Don't forward events of source "segment" when forwarding disabled.
        if (e.event_source === "segment" && !forward_events) {
          asUser.logger.debug("outgoing.event.skip", {
            reason: "Segment event without forwarding",
            event: e.event
          });
          return true;
        }

        if (send_events && send_events.length && !_lodash.default.includes(send_events, e.event)) {
          asUser.logger.debug("outgoing.event.skip", {
            reason: "not included in event list",
            event: e.event
          });
          return true;
        }

        const _ref3 = e.context || {},
              _ref3$location = _ref3.location,
              location = _ref3$location === void 0 ? {} : _ref3$location,
              _ref3$page = _ref3.page,
              page = _ref3$page === void 0 ? {} : _ref3$page,
              _ref3$referrer = _ref3.referrer,
              referrer = _ref3$referrer === void 0 ? {} : _ref3$referrer,
              _ref3$os = _ref3.os,
              os = _ref3$os === void 0 ? {} : _ref3$os,
              useragent = _ref3.useragent,
              _ref3$ip = _ref3.ip,
              ip = _ref3$ip === void 0 ? 0 : _ref3$ip;

        const event = e.event,
              properties = e.properties;
        const name = properties.name,
              category = properties.category;
        page.referrer = referrer.url;
        const type = event === "page" || event === "screen" ? event : "track";
        let track = {
          anonymousId: e.anonymous_id || anonymousId,
          messageId: e.event_id,
          timestamp: new Date(e.created_at),
          userId,
          properties,
          integrations,
          context: {
            ip,
            groupId,
            os,
            page,
            traits,
            location,
            userAgent: useragent,
            active: true
          }
        };

        if (_lodash.default.get(context, "library", null) !== null) {
          _lodash.default.set(track, "context.library", context.library);
        }

        if (type === "page") {
          const p = _objectSpread(_objectSpread({}, page), properties);

          track = _objectSpread(_objectSpread({}, track), {}, {
            name,
            channel: "browser",
            properties: p
          });
          track.context.page = p;
          analytics.page(track);
        } else if (type === "screen") {
          track = _objectSpread(_objectSpread({}, track), {}, {
            name,
            channel: "mobile",
            properties
          });
          analytics.enqueue("screen", track);
        } else {
          track = _objectSpread(_objectSpread({}, track), {}, {
            event,
            category
          });
          analytics.track(track);
        }

        asUser.logger.info("outgoing.event.success", {
          type,
          track
        });
        return true;
      });
    }

    return ret;
  };
}
import _ from "lodash";

export default function updateUserFactory(analyticsClient) {
  return function updateUser({ message = {} }, { ship = {}, hull = {}, ignoreFilters = false }) {
    const { user = {}, segments = [], events = [], account_segments = [], changes = {} } = message;
    const account = message.account || user.account;

    // Empty payload ?
    if (!user.id || !ship.id) {
      return false;
    }

    const asUser = hull.asUser(_.pick(user, ["email", "id", "external_id"]));

    // Custom properties to be synchronized
    const {
      synchronized_properties = [],
      synchronized_segments = [],
      synchronized_account_properties = [],
      forward_events = false,
      send_events = []
    } = ship.private_settings || {};

    // Build traits that will be sent to Segment
    // Use hull_segments by default
    const traits = { hull_segments: _.map(segments, "name") };
    if (synchronized_properties.length > 0) {
      synchronized_properties.map((prop) => {
        if (prop.indexOf("account.") === 0) {
          const t = prop.replace(/^account\./, "");
          traits[`account_${t.replace("/", "_")}`] = _.get(account, t);
        } else {
          traits[prop.replace(/^traits_/, "").replace("/", "_")] = _.get(user, prop);
        }
        return true;
      });
    }

    // Configure Analytics.js with write key
    // Ignore if write_key is not present
    const { write_key, handle_groups, handle_accounts, public_id_field, public_account_id_field } = ship.settings || {};
    if (!write_key) {
      return false;
    }

    const analytics = analyticsClient(write_key);

    // Look for an anonymousId
    // if we have events in the payload, we take the annymousId of the first event
    // Otherwise, we look for known anonymousIds attached to the user and we take the last one
    let anonymousId;
    if (events && events.length > 0 && events[0].anonymous_id) {
      anonymousId = events[0].anonymous_id;
    } else if (user.anonymous_ids && user.anonymous_ids.length) {
      anonymousId = _.first(user.anonymous_ids);
    }

    let publicIdField = "external_id";
    if (public_id_field) {
      publicIdField = public_id_field;
    }

    const userId = user[publicIdField];
    const groupId = user["traits_group/id"];

    const publicAccountIdField = public_account_id_field === "id" ? "id" : "external_id";
    const accountId = account && account[publicAccountIdField];

    // We have no identifier for the user, we have to skip
    if (!userId && !anonymousId) {
      asUser.logger.debug("outgoing.user.skip", { reason: "No Identifier (userId or anonymousId)", traits });
      return false;
    }

    const changedUserAttributes = _.keys(_.get(changes, "user", {}));
    const changedAccountAttributes = _.keys(_.get(changes, "account", {}));

    const libraryOverride = _.get(ship, "private_settings.context_library", null);

    const integrations = { Hull: false };
    const context = { active: false, ip: 0 };
    let ret = false;

    if (libraryOverride !== null) {
      try {
        const library = JSON.parse(libraryOverride);
        if (!_.has(library, "name") || !_.has(library, "version")) {
          hull.logger.debug("meta.library.invalid", "Library information is missing name or version.");
        } else {
          _.set(context, "library", library);
        }
      } catch (error) {
        // We failed to parse the library info, so just move on with the default.
        hull.logger.debug("meta.library.failed", JSON.stringify(error));
      }
    }
    const segment_ids = _.map(segments, "id");

    // only potentially skip if we are NOT ignoring filters
    // if we ARE ignoring filters, then don't skip ever
    if (!ignoreFilters) {
      // if this user does not belong to any of the synchronized segments
      // then we want to skip
      if (_.intersection(segment_ids, synchronized_segments).length === 0) {
        // Finally check to see if any of the synchronized segments is the "ALL"
        // if if it's not one of the segments, then skip it
        if (_.indexOf(synchronized_segments, "ALL") < 0) {
          asUser.logger.debug("outgoing.user.skip", { reason: "not matching any segment", segment_ids, traits });
          return false;
        }
      }
    }

    /**
     * ignoreFilters is a special boolean which is set on BATCH notifications
     * for batch notifications we do NOT want to filter, which is why it is used
     * in this case to bypass all the segment filtering
     */
    if (!_.isEmpty(_.get(changes, "segments", {})) ||
        _.intersection(synchronized_properties, changedUserAttributes).length > 0 ||
        !_.isEmpty(_.get(changes, "account_segments", {})) ||
        _.intersection(synchronized_account_properties, changedAccountAttributes).length > 0 ||
        ignoreFilters === true) {
      try {
        // Add group if available
        if (handle_groups && groupId && userId) {
          context.groupId = groupId;
          const groupTraits = _.reduce(user, (group, value, key) => {
            const mk = key.match(/^traits_group\/(.*)/);
            const groupKey = mk && mk[1];
            if (groupKey && groupKey !== "id") {
              group[groupKey] = value;
            }
            return group;
          }, {});

          // ignoreFilters is checked in this case because of a limitation in the platform
          // the platform doesn't send account segments for user updates
          // So do not put it in, otherwise will blank out hull segment trait on the other side
          if (!ignoreFilters) {
            // Add account segments
            _.set(groupTraits, "hull_segments", _.map(account_segments, "name"));
          }
          if (!_.isEmpty(groupTraits)) {
            asUser.logger.info("outgoing.group.success", { groupId, traits: groupTraits, context });
            analytics.group({ groupId, anonymousId, userId, traits: groupTraits, context, integrations });
          }
        } else if (handle_accounts && accountId) {
          const accountTraits = synchronized_account_properties
            .map(k => k.replace(/^account\./, ""))
            .reduce((props, prop) => {
              props[prop.replace("/", "_")] = account[prop];
              return props;
            }, {});

          // Please see comment above for why we only set this on !ignoreFilters
          if (!ignoreFilters) {
            // Add account segments
            _.set(accountTraits, "hull_segments", _.map(account_segments, "name"));
          }

          if (!_.isEmpty(accountTraits)) {
            hull.logger.debug("group.send", { groupId: accountId, traits: accountTraits, context });
            analytics.group({ groupId: accountId, anonymousId, userId, traits: accountTraits, context, integrations });
            asUser.account().logger.info("outgoing.account.success", { groupId: accountId, traits: accountTraits, context });
          } else {
            asUser.account().logger.debug("outgoing.account.skip", { reason: "Empty traits payload", groupId: accountId, traits: accountTraits, context });
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

      ret = analytics.identify({ anonymousId, userId, traits, context, integrations });
      asUser.logger.info("outgoing.user.success", { userId, traits });
    } else {
      asUser.logger.debug("outgoing.user.skip", { reason: "No changes detected that would require a synchronization to segment.com" });
      ret = false;
    }


    if (events && events.length > 0) {
      events.map((e) => {
        // Don't forward events of source "segment" when forwarding disabled.
        if (e.event_source === "segment" && !forward_events) {
          asUser.logger.debug("outgoing.event.skip", { reason: "Segment event without forwarding", event: e.event });
          return true;
        }
        if (send_events && send_events.length && !_.includes(send_events, e.event)) {
          asUser.logger.debug("outgoing.event.skip", { reason: "not included in event list", event: e.event });
          return true;
        }

        const { location = {}, page = {}, referrer = {}, os = {}, useragent, ip = 0 } = e.context || {};
        const { event, properties } = e;
        const { name, category } = properties;
        page.referrer = referrer.url;

        const type = (event === "page" || event === "screen") ? event : "track";

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
            active: true,
          }
        };

        if (_.get(context, "library", null) !== null) {
          _.set(track, "context.library", context.library);
        }

        if (type === "page") {
          const p = { ...page, ...properties };
          track = {
            ...track,
            name,
            channel: "browser",
            properties: p
          };
          track.context.page = p;
          analytics.page(track);
        } else if (type === "screen") {
          track = {
            ...track,
            name,
            channel: "mobile",
            properties
          };
          analytics.enqueue("screen", track);
        } else {
          track = { ...track, event, category };
          analytics.track(track);
        }

        asUser.logger.info("outgoing.event.success", { type, track });
        return true;
      });
    }
    return ret;
  };
}

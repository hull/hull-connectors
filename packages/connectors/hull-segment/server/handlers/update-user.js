// @flow

import _ from "lodash";
import type { HullContext, HullUserUpdateMessage } from "hull";
import shouldSkip from "../lib/should-skip-update";

const mapTraits = ({ synchronized_properties, user = {}, account = {} }) =>
  _.reduce(
    synchronized_properties,
    (traits, prop) => {
      if (prop.indexOf("account.") === 0) {
        const t = prop.replace(/^account\./, "");
        traits[`account_${t.replace("/", "_")}`] = account[t];
      } else {
        traits[prop.replace(/^traits_/, "").replace("/", "_")] = user[prop];
      }
      return traits;
    },
    {}
  );

export default function updateUser(analyticsClient, ctx: HullContext) {
  const { connector, client, isBatch } = ctx;
  const { private_settings, settings } = connector;
  const { getFirstAnonymousId } = client.utils.claims;

  // Custom properties to be synchronized
  const {
    synchronized_properties = [],
    synchronized_account_properties = [],
    forward_events = false,
    send_events = [],
    context_library
  } = private_settings;

  // Configure Analytics.js with write key
  // Ignore if write_key is not present
  const {
    write_key,
    handle_groups,
    handle_accounts,
    public_id_field,
    public_account_id_field
  } = settings;

  return async function update(message: HullUserUpdateMessage) {
    if (!write_key) {
      return false;
    }

    const {
      user = {},
      account = {},
      events = [],
      segments = [],
      segment_ids,
      account_segments = []
    } = message;

    // Empty payload ?
    if (!user.id || !connector.id) {
      return false;
    }

    const asUser = client.asUser(user, ["email", "id", "external_id"]);

    // Build traits that will be sent to Segment
    // Use hull_segments by default
    const traits = {
      hull_segments: _.map(segments, "name"),
      ...mapTraits({ synchronized_properties, user, account })
    };

    const analytics = analyticsClient(write_key);

    // Look for an anonymousId
    // if we have events in the payload, we take the annymousId of the first event
    // Otherwise, we look for known anonymousIds attached to the user and we take the last one
    const anonymousId =
      (_.first(events) || {}).anonymous_id || getFirstAnonymousId(user);

    const userId = user[public_id_field || "external_id"];
    const groupId = user["traits_group/id"];

    const publicAccountIdField =
      public_account_id_field === "id" ? "id" : "external_id";
    const accountId = account && account[publicAccountIdField];

    // We have no identifier for the user, we have to skip
    if (!userId && !anonymousId) {
      return asUser.logger.debug("outgoing.user.skip", {
        reason: "No Identifier (userId or anonymousId)",
        traits
      });
    }

    const skip = shouldSkip(ctx, message);
    if (skip) {
      return asUser.logger.debug("outgoing.user.skip", {
        reason: skip,
        segment_ids,
        traits
      });
    }

    const integrations = { Hull: false };
    const context = { active: false, ip: 0 };

    if (context_library) {
      try {
        const library = JSON.parse(context_library);
        const { name, version } = library;
        if (!name || !version) {
          client.logger.debug(
            "meta.library.invalid",
            "Library information is missing name or version."
          );
        } else {
          context.library = library;
        }
      } catch (error) {
        // We failed to parse the library info, so just move on with the default.
        client.logger.debug("meta.library.failed", error);
      }
    }

    analytics.identify({
      anonymousId,
      userId,
      traits,
      context,
      integrations
    });
    asUser.logger.info("outgoing.user.success", { userId, traits });

    try {
      const asAccount = asUser.account();
      // Add group if available
      if (handle_groups && groupId && userId) {
        context.groupId = groupId;
        const groupTraits = _.reduce(
          user,
          (group, value, key) => {
            const mk = key.match(/^traits_group\/(.*)/);
            const groupKey = mk && mk[1];
            if (groupKey && groupKey !== "id") {
              group[groupKey] = value;
            }
            return group;
          },
          {}
        );

        // isBatch is checked in this case because of a limitation in the platform
        // the platform doesn't send account segments for user updates
        // So do not put it in, otherwise will blank out hull segment trait on the other side
        if (!isBatch) {
          // Add account segments
          _.set(groupTraits, "hull_segments", _.map(account_segments, "name"));
        }
        if (!_.isEmpty(groupTraits)) {
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
        const accountTraits = synchronized_account_properties
          .map(k => k.replace(/^account\./, ""))
          .reduce((props, prop) => {
            props[prop.replace("/", "_")] = account[prop];
            return props;
          }, {});

        // Please see comment above for why we only set this on !isBatch
        if (!isBatch) {
          // Add account segments
          _.set(
            accountTraits,
            "hull_segments",
            _.map(account_segments, "name")
          );
        }
        if (!_.isEmpty(accountTraits)) {
          client.logger.debug("group.send", {
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
          asAccount.logger.info("outgoing.account.success", {
            groupId: accountId,
            traits: accountTraits,
            context
          });
        } else {
          asAccount.logger.debug("outgoing.account.skip", {
            reason: "Empty traits payload",
            groupId: accountId,
            traits: accountTraits,
            context
          });
        }
      } else {
        asAccount.logger.debug("outgoing.account.skip", {
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

    if (events && events.length > 0) {
      events.map(
        ({
          created_at,
          anonymous_id,
          event_id,
          context: {
            location = {},
            page = {},
            referrer = {},
            os = {},
            useragent,
            library,
            ip = 0
          },
          event_source,
          event,
          properties
        }) => {
          // Don't forward events of source "segment" when forwarding disabled.
          if (event_source === "segment" && !forward_events) {
            asUser.logger.debug("outgoing.event.skip", {
              reason: "Segment event without forwarding",
              event
            });
            return true;
          }
          if (!_.includes(send_events, event)) {
            asUser.logger.debug("outgoing.event.skip", {
              reason: "not included in event list",
              event
            });
            return true;
          }

          const { name, category } = properties;
          page.referrer = referrer.url;

          const track = {
            anonymousId: anonymous_id || anonymousId,
            messageId: event_id,
            timestamp: new Date(created_at),
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
              library,
              userAgent: useragent,
              active: true
            }
          };

          const type = event === "page" || event === "screen" ? event : "track";

          if (type === "page") {
            analytics.page({
              ...track,
              name,
              channel: "browser",
              properties: page,
              context: {
                ...track.context,
                page
              }
            });
          } else if (type === "screen") {
            analytics.enqueue("screen", {
              ...track,
              channel: "mobile",
              name,
              properties
            });
          } else {
            analytics.track({ ...track, event, category });
          }

          asUser.logger.info("outgoing.event.success", { type, track });
          return true;
        }
      );
    }
    return true;
  };
}

// @flow

import _ from "lodash";
import type {
  HullContext,
  HullEvent,
  HullUserUpdateMessage,
  HullNotificationResponse,
  HullKrakenResponse
} from "hull";
import type {
  SegmentClientFactory,
  SegmentContext,
  SegmentConnectorSettings
} from "../types";
import segmentEvent from "../lib/segment-event";
import { getfirstNonNull, getFirstAnonymousIdFromEvents } from "../lib/utils";

// import { notificationDefaultFlowControl } from "hull/lib/utils";

const segmentContext: SegmentContext = { active: false, ip: 0 };
const integrations = { Hull: false };

const update = (
  analyticsClient,
  { connector, metric, client, isBatch }: HullContext
) => (message: HullUserUpdateMessage): HullKrakenResponse => {
  const {
    settings = {},
    private_settings = {}
  }: SegmentConnectorSettings = connector;
  const { user, segments, events, message_id } = message;
  const account = message.account || user.account;

  // Empty payload ?
  if (!user.id || !connector.id) {
    return;
  }

  const asUser = client.asUser({ ...user });

  const {
    synchronized_properties = [],
    synchronized_segments = [],
    forward_events = false,
    send_events = []
  } = private_settings;

  const {
    write_key,
    // handle_accounts,
    public_id_field,
    public_account_id_field
  } = settings;

  if (!write_key) {
    return;
  }

  const analytics = analyticsClient(write_key);
  // Look for an anonymousId
  // if we have events in the payload, we take the annymousId of the first event
  // Otherwise, we look for known anonymousIds attached to the user and we take the first one
  const anonymousId =
    getFirstAnonymousIdFromEvents(events) ||
    getfirstNonNull(user.anonymous_ids);
  const userId = user[public_id_field];
  const groupId = account[public_account_id_field];
  const segmentIds = _.map(segments, "id");

  // We have no identifier for the user, we have to skip
  if (!userId && !anonymousId) {
    return {
      action: "skip",
      message: "No Identifier available",
      id: user.id,
      type: "user",
      data: { anonymousId, userId, public_id_field }
    };
  }

  // Process everyone when in batch mode.
  if (!isBatch && !_.size(_.intersection(segmentIds, synchronized_segments))) {
    return {
      message_id,
      action: "skip",
      message: "Not matching any segment",
      id: user.id,
      type: "user",
      data: { anonymousId, userId, segmentIds }
    };
  }

  const traits = _.reduce(
    synchronized_properties,
    (tts, attribute) => {
      if (attribute.indexOf("account.") === 0) {
        // Account attribute at User Level
        const t = attribute.replace(/^account\./, "");
        tts[`account_${t.replace("/", "_")}`] = _.get(account, t);
      } else {
        // Trait
        tts[attribute.replace(/^traits_/, "").replace("/", "_")] = _.get(
          user,
          attribute
        );
      }
      return tts;
    },
    {
      hull_segments: _.map(segments, "name")
    }
  );

  analytics.identify({
    anonymousId,
    userId,
    traits,
    context: segmentContext,
    integrations
  });

  metric.increment("ship.service_api.call", 1, ["type:identify"]);
  // asUser.logger.info("outgoing.user.success", { traits });

  events.map(
    (e: HullEvent): HullKrakenResponse => {
      const { event_id, event, event_source, context = {} } = e;
      if (event_source === "segment" && !forward_events) {
        // Skip event if it comes from Segment and we're not forwarding events
        return {
          message_id,
          action: "skip",
          message: "Event comes from segment and forward_events is disabled",
          id: user.id,
          type: "user",
          data: { anonymousId, userId, segmentIds, event_id }
        };
      }

      if (!_.includes(send_events, e.event)) {
        return {
          message_id,
          action: "skip",
          message: "Event not in whitelisted list",
          id: user.id,
          type: "user",
          data: { anonymousId, userId, segmentIds, event_id }
        };
      }

      const track = segmentEvent({
        analytics,
        anonymousId,
        event: e,
        userId,
        groupId,
        traits,
        integrations
      });

      const type = event === "page" || event === "screen" ? event : "track";

      if (track.channel === "browser") {
        metric.increment("ship.service_api.call", 1, ["type:page"]);
      } else if (track.channel === "mobile") {
        metric.increment("ship.service_api.call", 1, ["type:screen"]);
      } else {
        metric.increment("ship.service_api.call", 1, ["type:track"]);
      }
      asUser.logger.info("outgoing.event.success", { track });

      return {
        message_id,
        action: "success",
        id: user.id,
        type: "event",
        data: { track }
      };
    }
  );

  return {
    action: "success",
    message: "Success",
    id: user.id,
    type: "user",
    data: { anonymousId, userId, public_id_field, traits }
  };
};

module.exports = (analyticsClient: SegmentClientFactory) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const responses = await Promise.all(
    messages.map(update(analyticsClient, ctx))
  );
  return {
    responses: _.compact(responses),
    flow_control: {
      type: "next",
      size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
      in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1,
      in_time: 0
    }
  };
};

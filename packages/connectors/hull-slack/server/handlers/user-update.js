// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import getNotification from "../lib/get-notification";
import logResponses from "../lib/log-responses";
import type { ConnectSlackFunction } from "../types";

const debug = require("debug")("hull-slack:user-update");

const getSegmentChangeEvents = ({ event, synchronized_segment, changes }) => {
  const { left = [], entered = [] } = changes.segments || {};
  if (event === "ENTERED_USER_SEGMENT") {
    if (_.find(entered, e => e.id === synchronized_segment)) {
      return [
        {
          event: "Entered User Segment",
          properties: {
            name: synchronized_segment
          }
        }
      ];
    }
  }
  if (event === "LEFT_USER_SEGMENT") {
    if (_.find(left, e => e.id === synchronized_segment)) {
      return [
        {
          event: "Left User Segment",
          properties: {
            name: synchronized_segment
          }
        }
      ];
    }
  }
  return [];
};

const update = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const { client, connector, metric } = ctx;
  const { private_settings = {} } = connector;
  const {
    token = "",
    user_id = "",
    notify_events = [],
    attachements = []
  } = private_settings;
  try {
    const { post, tellOperator } = await connectSlack(ctx);
    if (!post || !tellOperator) {
      return {
        flow_control: "retry",
        size: 100,
        in: 1
      };
    }

    const responses = await Promise.all(
      _.map(messages, async (message: HullUserUpdateMessage) => {
        const { user } = message;

        const scopedClient = client.asUser(user);

        if (!client || !user.id || !token) {
          return {
            action: "skip",
            user_id: user.id,
            message: `Missing credentials, current token value: ${token}`
          };
        }

        try {
          _.map(
            notify_events,
            async ({ event, synchronized_segment, channel, text }) => {
              metric.increment("ship.outgoing.users");
              const { events = [], changes = {} } = message;
              const eventMatches = events
                .filter(e => e.event === event)
                .concat(
                  getSegmentChangeEvents({
                    event,
                    synchronized_segment,
                    changes
                  })
                );
              if (!eventMatches.length) {
                debug("Skipping Notification", {
                  event,
                  synchronized_segment,
                  channel,
                  message
                });
              }
              await Promise.all(
                eventMatches.map(async e => {
                  const payload = await getNotification({
                    message: { ...message, event: e },
                    client,
                    // actions,
                    text,
                    attachements
                  });
                  post({
                    scopedClient,
                    payload,
                    channel,
                    entity: "user"
                  });
                })
              );
              return null;
            }
          );
          return null;
        } catch (err) {
          scopedClient.logger.error("outgoing.user.error", {
            error: err.message
          });
          tellOperator({
            user_id,
            msg: `:crying_cat_face: Something bad happened while posting to the channels :${
              err.message
            }`
          });
          return null;
        }
      })
    );
    logResponses(client, responses);
    return {
      flow_control: {
        type: "next",
        size: 100,
        in: 0.1
      }
    };
  } catch (err) {
    return {
      flow_control: {
        type: "retry",
        size: 100,
        in: 5
      }
    };
  }
};
export default update;

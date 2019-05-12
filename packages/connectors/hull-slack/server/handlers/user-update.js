// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import userPayload from "../lib/user-payload";
import type { ConnectSlackFunction } from "../types";

const debug = require("debug")("hull-slack:user-update");

const getLoggableMessages = responses =>
  _.groupBy(_.compact(responses), "action");

const reduceActionUsers = actions =>
  _.reduce(
    actions,
    (m, v) => {
      m[v.user_id] = v.message;
      return m;
    },
    {}
  );

const logResponses = (hull, responses) =>
  _.map(getLoggableMessages(responses), (actions, name) => {
    hull.logger.info(`outgoing.user.${name}`, {
      user_ids: _.map(actions, "user_id"),
      data: reduceActionUsers(actions)
    });
  });

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
  { client, connector, metric }: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const { getBot } = await connectSlack({
      client,
      connector
    });
    const post = async (userClient, payload, channel) => {
      userClient.logger.info("outgoing.user.success", {
        text: payload.text,
        channel
      });
      metric.increment("ship.service_api.call");
      const bot = await getBot(connector);
      await bot.startConversationInChannel(channel);
      await bot.say(payload);
      return true;
    };
    const tellOperator = async (userClient, user_id, msg, error) => {
      userClient.logger.info("outgoing.user.error", { error, message: msg });
      const bot = await getBot(connector);
      await bot.startPrivateConversation(user_id);
      bot.say(msg);
    };

    const responses = await Promise.all(
      _.map(messages, async (message: HullUserUpdateMessage) => {
        const { user } = message;
        const { private_settings = {} } = connector;
        const {
          token = "",
          user_id = "",
          notify_events = [],
          attachements = []
        } = private_settings;

        const userClient = client.asUser(user);

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
                  const payload = await userPayload({
                    message: { ...message, event: e },
                    client,
                    // actions,
                    text,
                    attachements
                  });
                  post(userClient, payload, channel);
                })
              );
              return null;
            }
          );
          return null;
        } catch (err) {
          client.logger.error("outgoing.user.error", {
            error: err.message
          });
          tellOperator(
            userClient,
            user_id,
            `:crying_cat_face: Something bad happened while posting to the channels :${
              err.message
            }`,
            err
          );
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

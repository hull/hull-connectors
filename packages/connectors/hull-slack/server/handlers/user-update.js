// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import userPayload from "../lib/user-payload";
import type { ConnectSlackParams } from "../types";

const getChannel = (channels, name) =>
  _.find(channels, t => t.name === name.replace(/^#/, ""));

const getMember = (members, name) =>
  _.find(members, t => t.name === name.replace(/^@/, ""));

const getId = (teamChannels, teamMembers) => channel =>
  (
    (channel[0] === "@"
      ? getMember(teamMembers, channel)
      : getChannel(teamChannels, channel)) || {}
  ).id;

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

const shouldSendNotification = ({ event, synchronized_segment, message }) => {
  const { events = [], changes = {} } = message;
  const { left = [], entered = [] } = changes.segments || {};
  if (event === "ENTERED_USER_SEGMENT") {
    if (_.find(entered, e => e.id === synchronized_segment)) {
      return true;
    }
  }
  if (event === "LEFT_USER_SEGMENT") {
    if (_.find(left, e => e.id === synchronized_segment)) {
      return true;
    }
  }
  if (_.find(events, e => e.event === event)) {
    return true;
  }
  return false;
};

const update = (connectSlack: ConnectSlackParams => any) => async (
  { client, connector, metric }: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const { getBot, teamChannels, teamMembers } = await connectSlack({
      hull: client,
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
      await bot.sendActivity(payload);
      return true;
    };

    const tellOperator = async (userClient, user_id, msg, error) => {
      userClient.logger.info("outgoing.user.error", { error, message: msg });
      const bot = await getBot(connector);
      await bot.startPrivateConversation(user_id);
      bot.say(msg);
      // sayInPrivate(bot, user_id, msg);
    };

    const responses = await Promise.all(
      _.map(messages, async (message: HullUserUpdateMessage) => {
        const { user } = message;
        const { private_settings = {} } = connector;
        const {
          token = "",
          user_id = "",
          actions = [],
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
          const getChannelOrMemberId = getId(teamChannels, teamMembers);
          _.map(
            notify_events,
            async ({ event, synchronized_segment, channel, text }) => {
              const id = getChannelOrMemberId(channel);
              metric.increment("ship.outgoing.users");
              if (
                !shouldSendNotification({
                  event,
                  synchronized_segment,
                  message
                })
              ) {
                return null;
              }
              const payload = await userPayload({
                message,
                hull: client,
                actions,
                text,
                attachements
              });
              post(userClient, payload, id);
              return null;
            }
          );
          return null;
        } catch (err) {
          console.log(err);
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

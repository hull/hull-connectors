// @flow
import type { $Application } from "express";
import { Botkit } from "botkit";
import {
  SlackAdapter,
  SlackMessageTypeMiddleware,
  SlackEventMiddleware,
  SlackBotConfig
} from "botbuilder-adapter-slack";

import _ from "lodash";
import type {
  ConnectedSlack,
  HullSlackContext,
  SlackConnectorSettings,
  SlackInstance
} from "../types";
import interactiveMessage from "./interactive-message";
import { replies, join } from "./replies";
import setupChannels from "./setup-channels";

import getTeamChannels from "../lib/get-team-channels";
import getNotifyChannels from "../lib/get-notify-channels";
import getUniqueChannelNames from "../lib/get-unique-channel-names";

type BotFactoryParams = {
  webserver: $Application,
  devMode?: boolean,
  scopes: Array<string>,
  clientSecret: string,
  signingSecret?: string,
  clientID: string
};

type BotCache = {
  [string]: SlackInstance
};
module.exports = function BotFactory({
  webserver,
  scopes,
  clientID,
  clientSecret,
  signingSecret,
  devMode = false
}: BotFactoryParams) {
  const _bots: BotCache = {};

  const cache = (team_id: string, payload): SlackInstance => {
    _bots[team_id] = { ...payload };
    return _bots[team_id];
  };

  const getByTeam = (team_id: string): SlackInstance => _bots[team_id];

  const getBotConfig = (team_id: string): SlackBotConfig => {
    return (getByTeam(team_id) || {}).botConfig || {};
  };

  const adapter = new SlackAdapter({
    clientSigningSecret: signingSecret,
    clientId: clientID,
    clientSecret,
    scopes,
    redirectUri: "/auth/success",
    getTokenForTeam: async tid => getBotConfig(tid).bot_access_token,
    getBotUserByTeam: async tid => getBotConfig(tid).bot_user_id
  });
  adapter.use(new SlackEventMiddleware());
  adapter.use(new SlackMessageTypeMiddleware());

  const controller = new Botkit({
    clientId: clientID,
    clientSecret,
    webserver,
    adapter,
    stats_optout: true,
    interactive_replies: true,
    debug: devMode
  });

  async function getBot({ private_settings = {} }: SlackConnectorSettings) {
    const { team_id } = private_settings;
    if (!team_id) {
      throw new Error("Can't find a team ID for this Hull connector instance");
    }
    return controller.spawn(team_id);
  }

  async function connectSlack({
    client,
    clientCredentials,
    connector,
    metric
  }: HullSlackContext): Promise<ConnectedSlack> {
    const { private_settings = {} } = connector;
    const {
      bot: botConfig,
      token: app_token,
      team_id,
      // actions,
      attachements
    } = private_settings;
    if (!team_id) {
      return {};
    }
    if (!botConfig) {
      throw new Error(
        `Settings are invalid: private_settings:${JSON.stringify(
          private_settings
        )}, bot: ${!!botConfig}`
      );
    }

    const post = async ({
      scopedClient,
      payload,
      channel,
      entity = "user"
    }) => {
      scopedClient.logger.info(`outgoing.${entity}.success`, {
        text: payload.text,
        channel
      });
      metric.increment("ship.service_api.call");
      const bot = await getBot(connector);
      await bot.startConversationInChannel(channel);
      await bot.say(payload);
      return true;
    };
    const tellOperator = async ({ user_id, msg }) => {
      const bot = await getBot(connector);
      await bot.startPrivateConversation(user_id);
      bot.say(msg);
    };

    try {
      const channels = getUniqueChannelNames(getNotifyChannels(connector));
      let slackInstance = getByTeam(team_id);
      if (slackInstance) {
        return {
          ...slackInstance,
          post,
          tellOperator
        };
      }

      // First, cache the partial config so that the adapter can find it.
      cache(team_id, {
        botConfig
      });

      const bot = await getBot(connector);
      const { teamMembers, teamChannels } = await setupChannels({
        hull: client,
        bot,
        token: app_token,
        channels
      });
      // Then cache the full config over it;
      slackInstance =
        cache(team_id, {
          botConfig,
          attachements,
          teamMembers,
          teamChannels,
          clientCredentials
        }) || {};
      // const { bot } = botSetup;
      client.logger.info("register.success");
      client.logger.info("register.success");
      controller.on("bot_channel_join", join);
      controller.on("bot_channel_join", () => getTeamChannels(bot));
      controller.on("bot_channel_leave", () => getTeamChannels(bot));
      controller.on("interactive_message_callback", interactiveMessage);
      _.map(
        replies(getByTeam),
        ({ message = "test", context = "direct_message", reply = () => {} }) =>
          controller.hears(message, context, reply)
      );
      return {
        ...slackInstance,
        post,
        tellOperator
      };
    } catch (err) {
      client.logger.error("register.error", {
        error: err.message
      });
      throw err;
    }
  }

  return {
    controller,
    connectSlack
  };
};

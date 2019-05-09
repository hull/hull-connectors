// @flow
import type { $Application } from "express";
import { Botkit } from "botkit";
import {
  SlackAdapter,
  SlackMessageTypeMiddleware,
  SlackEventMiddleware
} from "botbuilder-adapter-slack";

import _ from "lodash";
import type { ConnectSlackParams, Bot } from "./types";
import interactiveMessage from "./bot/interactive-message";
import { replies, join } from "./bot";
import getTeamChannels from "./lib/get-team-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";

import setupChannels from "./lib/setup-channels";

type BotFactoryParams = {
  webserver: $Application,
  devMode?: boolean,
  scopes: Array<string>,
  clientSecret: string,
  signingSecret?: string,
  clientID: string
};

module.exports = function BotFactory({
  webserver,
  scopes,
  clientID,
  clientSecret,
  signingSecret,
  devMode = false
}: BotFactoryParams) {
  const _bots = {};

  const cache = ({ botConfig, actions, attachements, team_id, hull }) => {
    _bots[team_id] = { hull, actions, attachements, botConfig };
    return _bots[team_id];
  };

  const getByTeam = (team_id: string) => _bots[team_id];

  const getBotConfig = (team_id: string) => {
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

  async function getBot({ private_settings = {} }) {
    const { team_id } = private_settings;
    if (!team_id) {
      throw new Error("Can't find a team ID for this Hull connector instance");
    }
    return controller.spawn(team_id);
  }

  async function connectSlack({ hull, connector }: ConnectSlackParams): Bot {
    const { private_settings = {} } = connector;
    const {
      bot: botConfig,
      actions,
      attachements,
      token: app_token,
      team_id
    } = private_settings;

    if (!botConfig) {
      throw new Error(
        `Settings are invalid: private_settings:${JSON.stringify(
          private_settings
        )}, bot: ${!!botConfig}`
      );
    }

    try {
      const channels = getUniqueChannelNames(getNotifyChannels(connector));
      const botSetup = getByTeam(team_id);
      if (botSetup) {
        return {
          ...botSetup,
          getBot
        };
      }
      // First, cache the partial config so that the adapter can find it.
      cache({
        botConfig,
        hull,
        actions,
        attachements,
        team_id
      });
      const bot = await getBot(connector);
      const { teamMembers, teamChannels } = await setupChannels({
        hull,
        bot,
        token: app_token,
        channels
      });
      // Then cache the full config over it;
      const cachedBot = cache({
        botConfig,
        actions,
        attachements,
        team_id,
        hull,
        teamMembers,
        teamChannels
      });
      // const { bot } = botSetup;
      hull.logger.info("register.success");
      hull.logger.info("register.success");
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
        ...cachedBot,
        getBot
      };
    } catch (err) {
      hull.logger.error("register.error", {
        error: err.message
      });
      throw err;
    }
  }

  return {
    controller,
    getBot,
    getByTeam,
    connectSlack
  };
};

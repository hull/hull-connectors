// @flow
//
import Hull from "hull";
import _ from "lodash";
import type { HullContext } from "hull";
import type { SlackInstance } from "../types";
import getNotification from "../lib/get-notification";
import getSearchHash from "../lib/get-search-hash";
import messages from "./messages";
import ack from "./ack";
import getMessageLogData from "../lib/get-log-data";

const defaultText = "{{ user.email | default: 'no email' }}";
type SlackMessage = {
  team: string,
  channel: string,
  text: string
};
type SlackBot = any;
type HullClient = Hull.Client | Class<Hull.Client>;

/* Special Conversations */
export function welcome(bot: SlackBot, user_id: string) {
  bot.startPrivateConversation({ user: user_id }, (error, convo) => {
    if (error) return console.log(error);
    convo.say(messages.welcome);
    return true;
  });
}

export function join(bot: SlackBot, message: SlackMessage) {
  bot.say({
    text: messages.join,
    channel: message.channel
  });
}

/* STANDARD BOT REPLIES, WRAPPED WITH LOGGING */

function sad(client: HullClient, bot: SlackBot, message: SlackMessage, err) {
  client.logger.error("bot.error", { error: err });
  return bot.reply(message, `:scream: Something bad happened (${err.message})`);
}
function reply(
  client: HullClient,
  bot: SlackBot,
  message: SlackMessage,
  res: { text: string } = {}
) {
  client.logger.info("bot.reply", {
    ...getMessageLogData(message),
    text: res.text
  });
  return bot.reply(message, res);
}

/* MAIN USER ACTION */
const postUser = (ctx, getByTeam, type, options = {}) =>
  async function post(bot: SlackBot, msg: SlackMessage) {
    ack(bot, msg, "mag_right");
    const search = getSearchHash(type, msg);
    // const { attachements } = getByTeam(msg.team);
    const { client, connector } = ctx;
    const { private_settings } = connector;
    const { attachements } = private_settings;
    const logMsg = {
      type,
      search,
      options,
      ...getMessageLogData(msg)
    };
    const { email }: { email: string } = search;

    client.logger.info("bot.hear", logMsg);

    try {
      const payloads = await ctx.entities.get({
        claims: { email },
        entity: "user",
        include: { events: true, account: true }
      });
      const message = _.first(payloads.data);
      // $FlowFixMe
      const { user } = message || {};
      if (!user) {
        client.logger.info("user.fetch.fail", { message, search, type });
        throw new Error("¯\\_(ツ)_/¯ Can't find a user");
      }

      const res = await getNotification({
        client,
        message,
        text: defaultText,
        attachements,
        entity: "user"
      });

      reply(client, bot, msg, res);
    } catch (err) {
      sad(client, bot, msg, err);
      throw err;
    }
  };

type GetByTeam = string => SlackInstance;
/* BUTTONS */
export const replies = (ctx: HullContext, getByTeam: GetByTeam) => [
  {
    message: new RegExp(
      /^(info|search|whois|who is)?\s+<(mailto):(.+?)\|(.+?)>$/
    ),
    context: "direct_message,mention,direct_mention",
    reply: postUser(ctx, getByTeam, "email")
  },
  {
    message: new RegExp(/^<(mailto):(.+)\|(.+)>$/),
    context: "direct_message,mention,direct_mention",
    reply: postUser(ctx, getByTeam, "email")
  },
  // {
  //   message: [
  //     "^\\s*<(mailto):(.+?)\\|(.+)>\\s+(.*)$",
  //     "^attributes\\s*<(mailto):(.+?)\\|(.+)>\\s+(.*)$"
  //   ],
  //   context: "direct_message,mention,direct_mention",
  //   reply: postUser(ctx, getByTeam, "email", {
  //     action: { name: "expand", value: "traits" }
  //   })
  // },
  // {
  //   message: ["^events\\s<(mailto):(.+?)\\|(.+)>\\s*$"],
  //   context: "direct_message,mention,direct_mention",
  //   reply: postUser(ctx, getByTeam, "email", {
  //     action: { name: "expand", value: "events" }
  //   })
  // },
  {
    message: new RegExp(/^(info|search)\sid:(.+)/),
    context: "direct_message,mention,direct_mention",
    reply: postUser(ctx, getByTeam, "id")
  },
  {
    message: new RegExp(/^info\s"(.+)"\s?(.*)$', "^info (.+)$/),
    context: "direct_message,mention,direct_mention",
    reply: postUser(ctx, getByTeam, "name")
  },
  {
    message: ["hello", "hi"],
    context: "direct_message,mention,direct_mention", // Default
    reply: (bot: SlackBot, message: SlackMessage) => {
      const { clientCredentials } = getByTeam(message.team);
      if (clientCredentials) {
        const client = new Hull.Client(clientCredentials);
        return reply(client, bot, message, {
          text: messages.hi
        });
      }
      return sad(Hull.Client, bot, message, {
        message: "Something's wrong with the setup"
      });
    }
  },
  {
    message: "help",
    context: "direct_message,mention,direct_mention", // Default
    reply: (bot: SlackBot, message: SlackMessage) => {
      const m = messages[message.text];
      const { clientCredentials } = getByTeam(message.team);
      if (clientCredentials) {
        const client = new Hull.Client(clientCredentials);
        if (m)
          return reply(client, bot, message, {
            text: m
          });
      }
      return reply(Hull.Client, bot, message, {
        text: messages.notfound
      });
    }
  }
  // {
  //   message: new RegExp(/^kill$/,
  //   reply: (bot, message) => {
  //     ack(bot, message, "cry");
  //     bot.reply(message, ":wave: Bby");
  //     bot.rtm.close();
  //   }
  // }
  //   message: [
  //     "^set\\s+<(mailto):(.+?)\\|(.+)>\\s+(.+)$"
  //   ],
  //   context: "direct_message,mention,direct_mention",
  //   reply: traitUser("email")
  // }, {
];

// @noflow
import Hull from "hull";
import getNotification from "../lib/get-notification";
import getSearchHash from "../lib/get-search-hash";
import fetchUser from "../hull/fetch-user";
import messages from "./messages";
import ack from "./ack";
import getMessageLogData from "../lib/get-log-data";

function _replaceBotName(bot, m = "") {
  return m.replace(/@hull/g, `@${bot.identity.name}`);
}

/* Special Conversations */
export function welcome(bot, user_id) {
  bot.startPrivateConversation({ user: user_id }, (error, convo) => {
    if (error) return console.log(error);
    convo.say(messages.welcome);
    return true;
  });
}

export function join(bot, message) {
  bot.say({
    text: messages.join,
    channel: message.channel
  });
}

/* STANDARD BOT REPLIES, WRAPPED WITH LOGGING */

function sad(hull, bot, message, err) {
  hull.logger.error("bot.error", { error: err });
  return bot.reply(message, `:scream: Something bad happened (${err.message})`);
}
function rpl(hull, bot, message, res = {}) {
  hull.logger.info("bot.reply", {
    ...getMessageLogData(message),
    text: res.text
  });
  return bot.reply(message, res);
}

/* MAIN USER ACTION */
const postUser = (getByTeam, type, options = {}) =>
  async function post(bot, msg) {
    ack(bot, msg, "mag_right");
    const search = getSearchHash(type, msg);
    const { actions, attachements, hull } = getByTeam(msg.team);
    console.log(search, msg.matches);
    const msgdata = getMessageLogData(msg);
    hull.logger.info("bot.hear", {
      type,
      search,
      options,
      ...msgdata
    });

    try {
      const {
        user,
        account,
        events,
        segments,
        pagination,
        message = ""
      } = await fetchUser({ hull, search, options });

      if (!user) {
        hull.logger.info("user.fetch.fail", { message, search, type });
        throw new Error(`¯\\_(ツ)_/¯ ${message}`);
      }

      hull.logger.info("user.fetch.success", { ...msgdata, search, type });

      // const { action = {} } = options;
      // const payload = ;
      // const { user, account, events, segments } = message;
      //
      // if (action.name === "expand") {
      //   // if there is a search, set group name to search,
      //   // else set to action value;
      //   payload.group =
      //     search.rest === "full" ? "traits" : search.rest || action.value;
      // }

      const res = await getNotification({
        hull,
        message: { user, account, events, segments },
        attachements,
        actions,
        entity: "user"
      });
      hull.logger.debug("outgoing.user.reply", res);
      if (pagination.total > 1) {
        res.text = `Found ${pagination.total} users, Showing ${res.text}`;
      }
      rpl(hull, bot, msg, res);
    } catch (err) {
      sad(hull, bot, msg, err);
      throw err;
    }
  };

/* BUTTONS */
export const replies = getByTeam => [
  {
    message: new RegExp(
      /^(info|search|whois|who is)?\s+<(mailto):(.+?)\|(.+?)>$/
    ),
    context: "direct_message,mention,direct_mention",
    reply: postUser(getByTeam, "email")
  },
  {
    message: new RegExp(/^<(mailto):(.+)|(.+)>$/),
    context: "direct_message,mention,direct_mention",
    reply: postUser(getByTeam, "email")
  },
  // {
  //   message: [
  //     "^\\s*<(mailto):(.+?)\\|(.+)>\\s+(.*)$",
  //     "^attributes\\s*<(mailto):(.+?)\\|(.+)>\\s+(.*)$"
  //   ],
  //   context: "direct_message,mention,direct_mention",
  //   reply: postUser(getByTeam, "email", {
  //     action: { name: "expand", value: "traits" }
  //   })
  // },
  // {
  //   message: ["^events\\s<(mailto):(.+?)\\|(.+)>\\s*$"],
  //   context: "direct_message,mention,direct_mention",
  //   reply: postUser(getByTeam, "email", {
  //     action: { name: "expand", value: "events" }
  //   })
  // },
  {
    message: new RegExp(/^(info|search)\sid:(.+)/),
    context: "direct_message,mention,direct_mention",
    reply: postUser(getByTeam, "id")
  },
  {
    message: new RegExp(/^info\s"(.+)"\s?(.*)$', "^info (.+)$/),
    context: "direct_message,mention,direct_mention",
    reply: postUser(getByTeam, "name")
  },
  {
    message: ["hello", "hi"],
    context: "direct_message,mention,direct_mention", // Default
    reply: (bot, message) => {
      const hull = new Hull(bot.config.hullConfig);
      return rpl(hull, bot, message, messages.hi);
    }
  },
  {
    message: "help",
    context: "direct_message,mention,direct_mention", // Default
    reply: (bot, message) => {
      const m = messages[message.text];
      const hull = new Hull(bot.config.hullConfig);
      if (m) return rpl(hull, bot, message, _replaceBotName(bot, m));
      return rpl(hull, bot, message, messages.notfound);
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

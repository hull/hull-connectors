// @noflow
import Hull from "hull";
import _ from "lodash";
import fetchEvent from "../hull/fetch-event";
import fetchUser from "../hull/fetch-user";
import formatEventProperties from "../lib/format-event-properties";
import getNotification from "../lib/get-notification";

module.exports = async function interactiveMessage(bot, message) {
  const { actions, callback_id, original_message } = message;
  const [action] = actions;
  const { name, value } = action;

  const client = new Hull(bot.config.hullConfig);
  client.logger.info("bot.interactiveMessage.post", {
    name,
    value,
    callback_id
  });

  if (name === "trait") {
    try {
      client
        .asUser({ id: callback_id })
        .traits(JSON.parse(value), { sync: true });
      bot.reply(message, "User Updated :thumbsup:");
    } catch (e) {
      client.logger.error("bot.interactiveMessage.error", {
        type: "update",
        message: e.message
      });
    }
  } else if (name === "expand") {
    if (value === "event") {
      const index = _.findIndex(
        original_message.attachments,
        a => a.callback_id === callback_id
      );
      const attachement = { ...original_message.attachments[index] };
      const attachments = [...original_message.attachments];

      attachments[index] = attachement;

      try {
        const { events } = await fetchEvent({
          client,
          search: { id: callback_id }
        });
        const [event = {}] = events;
        const { props } = event;
        attachement.fields = formatEventProperties(props);
        attachement.actions = [];
        bot.replyInteractive(message, { ...original_message, attachments });
      } catch (err) {
        client.logger.error("bot.interactiveMessage.error", {
          type: "event",
          message: err.message
        });
      }
    }

    if (value === "traits" || value === "events") {
      const { user, account, events, segments, msg = "" } = await fetchUser({
        client,
        search: { id: callback_id },
        options: { action: { value } }
      });
      const payload = await getNotification({
        client,
        message: { user, account, events, segments },
        actions,
        entity: "user"
      });
      bot.replyInteractive(msg, payload);
    }
  }
  return true;
};

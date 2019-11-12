// @noflow
import type { HullContext } from "hull";
import _ from "lodash";
import getNotification from "../lib/get-notification";

module.exports = async function interactiveMessage(ctx: HullContext) {
  return async function interactive(bot, message) {
    const { client } = ctx;
    const { actions, callback_id } = message;
    const [action] = actions;
    const { name, value } = action;

    client.logger.info("bot.interactiveMessage.post", {
      name,
      value,
      callback_id
    });

    // if (name === "trait") {
    // try {
    //   client
    //     .asUser({ id: callback_id })
    //     .traits(JSON.parse(value), { sync: true });
    //   bot.reply(message, "User Updated :thumbsup:");
    // } catch (e) {
    //   client.logger.error("bot.interactiveMessage.error", {
    //     type: "update",
    //     message: e.message
    //   });
    // }
    // } else if (name === "expand") {
    //   if (value === "event") {
    //     const index = _.findIndex(
    //       original_message.attachments,
    //       a => a.callback_id === callback_id
    //     );
    //     const attachement = { ...original_message.attachments[index] };
    //     const attachments = [...original_message.attachments];
    //
    //     attachments[index] = attachement;
    //
    //     try {
    //       const { events } = await fetchEvent({
    //         client,
    //         search: { id: callback_id }
    //       });
    //       const [event = {}] = events;
    //       const { props } = event;
    //       attachement.fields = formatEventProperties(props);
    //       attachement.actions = [];
    //       bot.replyInteractive(message, { ...original_message, attachments });
    //     } catch (err) {
    //       client.logger.error("bot.interactiveMessage.error", {
    //         type: "event",
    //         message: err.message
    //       });
    //     }
    //   }
    //
    //   if (value === "traits" || value === "events") {
    try {
      const payloads = await ctx.entities.get({
        entity: "user",
        claims: {
          id: callback_id
        }
      });
      const notification = await getNotification({
        client,
        message: _.first(payloads.data),
        actions,
        entity: "user"
      });
      bot.replyInteractive(message, notification);
    } catch (err) {
      bot.replyInteractive(message, err.message);
    }
    //   }
    // }
    return true;
  };
};

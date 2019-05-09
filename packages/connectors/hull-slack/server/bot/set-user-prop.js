//@noflow
/* ACTIONS */

// function traitUser(type) {
//   return function trait(bot, message) {
//     ack(bot, message, "gear");

//     if (!message.match[4]) return bot.reply(message, "You need to specify a set of properties");

//     try {
//       const payload = JSON.parse(message.match[4]);
//       if (!_.isObject(payload)) throw new Error("Invalid JSON payload");
//       // const qs = querystring.parse()
//       fetchUser(type, bot, message, function callback({ hull, /* search,*/ results }) {
//         if (!results || !results.user) return "¯\\_(ツ)_/¯ Couldn't find anyone!";
//         hull.asUser(results.user.id).traits(payload);
//         return bot.reply(message, {
//           text: `Updated ${results.user.email}`,
//           attachments: [{
//             pretext: "Allow a few seconds for data to update",
//             text: `\`\`\`\n${JSON.stringify(payload)}\`\`\``,
//             mrkdwn_in: ["text", "pretext"]
//           }]
//         });
//       });
//     } catch (e) {
//       console.log(e);
//       return bot.reply(message, "The JSON you sent is not valid");
//     }
//     return true;
//   };
// }

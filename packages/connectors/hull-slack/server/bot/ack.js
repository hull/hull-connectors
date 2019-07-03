// @noflow
module.exports = function ack(bot, message, name = "robot_face") {
  if (bot && bot.api) {
    bot.api.reactions.add(
      {
        timestamp: message.ts,
        channel: message.channel,
        name
      },
      err => {
        if (err) console.log(err);
        return true;
      }
    );
  }
};

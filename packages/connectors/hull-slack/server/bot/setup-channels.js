// @noflow
import _ from "lodash";

function joinChannels(bot, token, channels) {
  const user = bot.config.bot_id;
  return Promise.all(
    _.map(channels, channel => {
      return new Promise((resolve, reject) => {
        bot.api.channels.invite({ token, channel: channel.id, user }, err => {
          if (err) return reject(err);
          return resolve(channel.id);
        });
      });
    })
  );
}

function getChannelsToJoin(teamChannels, channels) {
  return _.filter(
    teamChannels,
    channel => _.includes(channels, channel.id) && channel.is_member === false
  );
}

export default async function({
  hull,
  bot,
  app_token,
  channels,
  teamChannels
}) {
  try {
    const chans = _.filter(channels, c => c.indexOf("@") !== 0);
    const channelsToJoin = getChannelsToJoin(teamChannels, chans);
    if (channelsToJoin.length) {
      try {
        await joinChannels(bot, app_token, channelsToJoin);
      } catch (err) {
        hull.logger.error("bot.setup.error", {
          object: "channel",
          type: "invite",
          error: err
        });
        throw err;
      }
    }
  } catch (err) {
    hull.logger.error("bot.setup.error", { error: err });
    throw err;
  }
}

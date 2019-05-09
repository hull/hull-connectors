// @noflow
import _ from "lodash";
import getTeamChannels from "./get-team-channels";
import getTeamMembers from "./get-team-members";

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

function createChannels(bot, token, channelsToJoin = []) {
  return Promise.all(
    _.map(channelsToJoin, name => {
      return new Promise((resolve, reject) => {
        bot.api.channels.create({ token, name }, (err, channel = {}) => {
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
    channel => _.includes(channels, channel.name) && channel.is_member === false
  );
}

function getChannelsToCreate(teamChannels, channels) {
  return _.filter(
    channels,
    channel => !_.includes(_.map(teamChannels, "name"), channel)
  );
}

export default async function({ hull, bot, app_token, channels }) {
  try {
    const [teamChannels, teamMembers] = await Promise.all([
      getTeamChannels(bot),
      getTeamMembers(bot)
    ]);

    const chans = _.filter(channels, c => c.indexOf("@") !== 0);
    const channelsToJoin = getChannelsToJoin(teamChannels, chans);
    const channelsToCreate = getChannelsToCreate(teamChannels, chans);

    // hull.logger.info("bot.setup.start", {
    //   object: "channel",
    //   chans,
    //   teamChannels: _.map(teamChannels, "id")
    // });

    try {
      if (channelsToCreate.length || channelsToJoin.length) {
        if (channelsToCreate.length) {
          try {
            await createChannels(bot, app_token, channelsToCreate);
          } catch (err) {
            hull.logger.error("bot.setup.error", {
              object: "channel",
              type: "create",
              error: err
            });
            throw err;
          }
        }
        if (channelsToCreate.length && channelsToJoin.length) {
          try {
            await getTeamChannels(bot);
          } catch (err) {
            hull.logger.error("bot.setup.error", {
              object: "channel",
              type: "refresh",
              error: err
            });
            throw err;
          }
        }
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
      }
    } catch (err) {
      hull.logger.error("bot.setup.error", { error: err });
    }

    return {
      teamChannels,
      teamMembers
    };
  } catch (err) {
    throw err;
  }
}

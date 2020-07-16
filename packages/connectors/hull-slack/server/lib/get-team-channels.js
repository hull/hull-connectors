// @noflow
const _ = require("lodash");

// TODO duplicated to get team members. Need to create and move to slack-service-client
async function getChannels({ bot, cursor = "", pagedChannels = [] }) {
  const options = {
    limit: 9999,
    exclude_archived: true,
    exclude_members: true
  }

  if (!_.isEmpty(cursor)) {
    _.set(options, "cursor", cursor);
  }

  const response = await bot.api.channels.list(options);
  const { ok, channels, response_metadata } = response;
  const { next_cursor } = response_metadata;

  Array.prototype.push.apply(pagedChannels, channels);

  if (!_.isEmpty(next_cursor)) {
    return getChannels({ bot, cursor: next_cursor, pagedChannels });
  }

  if (!ok) {
    console.log(ok);
    throw new Error("Failed to fetch channels");
  }

  return pagedChannels;
}

const getTeamChannels = async bot => {
  // if (!force && botSetup.teamChannels) return botSetup.teamChannels;

  try {
   return getChannels({ bot });
  } catch (err) {
    throw err;
  }
  // return botSetup.teamChannels;
};

export default getTeamChannels;

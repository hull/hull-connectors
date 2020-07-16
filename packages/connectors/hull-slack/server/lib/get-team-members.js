// @noflow
const _ = require("lodash");

// TODO duplicated to get team channels. Need to create and move to slack-service-client
async function getMembers({ bot, cursor = "", pagedMembers = [] }) {
  const options = {
    limit: 9999
  }

  if (!_.isEmpty(cursor)) {
    _.set(options, "cursor", cursor);
  }

  const response = await bot.api.users.list(options);
  const { ok, members, response_metadata } = response;
  const { next_cursor } = response_metadata;

  Array.prototype.push.apply(pagedMembers, members);

  if (!_.isEmpty(next_cursor)) {
    return getMembers({ bot, cursor: next_cursor, pagedMembers });
  }

  if (!ok) {
    console.log(ok);
    throw new Error("Failed to fetch members");
  }

  return pagedMembers;
}

const getTeamMembers = async bot => {
  // if (!force && botSetup.teamMembers) return botSetup.teamMembers;

  try {
    return getMembers({ bot })
  } catch (err) {
    throw err;
  }
  // return botSetup.teamMembers;
};

export default getTeamMembers;

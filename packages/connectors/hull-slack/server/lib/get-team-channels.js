// @noflow
const getTeamChannels = async bot => {
  // if (!force && botSetup.teamChannels) return botSetup.teamChannels;

  try {
    const { ok, channels } = await bot.api.channels.list({
      limit: 9999,
      exclude_archived: true,
      exclude_members: true
    });
    // botSetup.teamChannels = channels;
    if (!ok) {
      console.log(ok);
      throw new Error("Not OK");
    }
    return channels;
  } catch (err) {
    throw err;
  }
  // return botSetup.teamChannels;
};

export default getTeamChannels;

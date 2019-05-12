// @noflow
const getTeamMembers = async bot => {
  // if (!force && botSetup.teamMembers) return botSetup.teamMembers;

  try {
    const { ok, members } = await bot.api.users.list({
      limit: 9999
    });
    // botSetup.teamMembers = members;
    if (!ok) {
      console.log(ok);
      throw new Error("Not OK");
    }
    return members;
  } catch (err) {
    throw err;
  }
  // return botSetup.teamMembers;
};

export default getTeamMembers;

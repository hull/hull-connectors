// @flow
import type { HullContext, HullExternalResponse } from "hull";
import type { ConnectSlackFunction } from "../types";

const formatList = (list, prefix = "") =>
  list.map(({ name: label, id: value }) => ({
    label: `${prefix}${label}`,
    value
  }));
const fetchDestinations = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext
): HullExternalResponse => {
  const { getChannels } = await connectSlack(ctx);
  const { teamChannels, teamMembers } = await getChannels();
  if (!teamMembers || !teamChannels) {
    return {
      status: 200,
      data: {
        options: [{ label: "Configure Slack credentials first " }]
      }
    };
  }
  return {
    status: 200,
    data: {
      options: [
        {
          label: "Channels",
          options: formatList(teamChannels, "#")
        },
        {
          label: "Members",
          options: formatList(teamMembers, "@")
        }
      ]
    }
  };
};

export default fetchDestinations;

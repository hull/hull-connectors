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
  const { slackInstance } = await connectSlack(ctx);
  const { teamMembers, teamChannels } = slackInstance;
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

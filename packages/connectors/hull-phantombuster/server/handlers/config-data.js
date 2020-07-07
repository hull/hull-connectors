// @flow
import type { HullContext } from "hull";
import _ from "lodash";
import updateAgentDetails from "../lib/agent-details";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  const agent = await updateAgentDetails(ctx, true);
  return {
    ..._.pick(ctx.connector.private_settings, "id", "api_key", "sync_interval"),
    agent
  };
};

export default configHandler;

// @flow
import type { HullContext } from "hull";
import _ from "lodash";
import updateAgentDetails from "../lib/agent-details";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  const baseconfig = _.pick(
    ctx.connector.private_settings,
    "agent_id",
    "org",
    "api_key",
    "sync_interval"
  );
  try {
    const { agent, org } = await updateAgentDetails(ctx, true);
    return { ...baseconfig, agent, org };
  } catch (error) {
    return { ...baseconfig, config_error: error.message };
  }
};

export default configHandler;

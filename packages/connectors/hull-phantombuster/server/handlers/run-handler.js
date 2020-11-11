// @flow

import type { HullContext, HullUISelectResponse } from "hull";
import updateAgentDetails from "../lib/agent-details";

const agentsHandler = async (ctx: HullContext): HullUISelectResponse => {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { api_key } = private_settings;
  if (!api_key) {
    return {
      status: 200,
      data: {
        label: "Please enter API key above"
      }
    };
  }
  try {
    const { agent, org } = await updateAgentDetails(ctx, true);

    // $FlowFixMe
    ctx.enqueue("fetchAll", { agent, org });

    return {
      status: 200,
      data: {
        message: "Agent launched, Fetching results starts in 60 seconds",
        ok: true
      }
    };
  } catch (err) {
    return {
      status: 500,
      error: err?.response?.body?.error || err
    };
  }
};

export default agentsHandler;

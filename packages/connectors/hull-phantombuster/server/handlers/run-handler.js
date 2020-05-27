// @flow

import type { HullContext, HullUISelectResponse } from "hull";
import updateAgentDetails from "../lib/agent-details";

const agentsHandler = async (ctx: HullContext): HullUISelectResponse => {
  const { connector, request } = ctx;
  const { private_settings = {} } = connector;
  const { agent_id, api_key } = private_settings;
  if (!api_key) {
    return {
      status: 200,
      data: {
        label: "Please enter API key above"
      }
    };
  }
  try {
    const agent = await updateAgentDetails(ctx, true);
    // const response = await request
    //   .get(`https://phantombuster.com/api/v1/agent/${agent_id}/launch`)
    //   .type("json")
    //   .set({
    //     "X-Phantombuster-key": api_key
    //   });

    // $FlowFixMe
    ctx.enqueue("fetchAll", { agent });
    //
    // if (!response?.body?.status === "success") {
    //   return {
    //     status: 500,
    //     error: response?.body?.error
    //   };
    // }

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

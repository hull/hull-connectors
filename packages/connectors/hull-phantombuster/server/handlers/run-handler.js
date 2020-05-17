// @flow

import type { HullContext, HullUISelectResponse } from "hull";

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
    const response = await request
      .get(`https://phantombuster.com/api/v1/agent/${agent_id}/launch`)
      .query({ output: "first-result-object" })
      .type("json")
      .set({
        "X-Phantombuster-key": api_key
      });

    if (!response?.body?.status === "success") {
      return {
        status: 500,
        error: response?.body?.error
      };
    }

    return {
      status: 200,
      data: {
        ok: response?.body?.status
      }
    };
  } catch (err) {
    return {
      status: 500,
      error: err
    };
  }
};

export default agentsHandler;

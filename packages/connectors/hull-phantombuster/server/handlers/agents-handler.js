// @flow

import type { HullContext, HullUISelectResponse } from "hull";

const agentsHandler = async (ctx: HullContext): HullUISelectResponse => {
  const { connector, request } = ctx;
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
    const response = await request
      .get("https://phantombuster.com/api/v1/user")
      .type("json")
      .set({
        "X-Phantombuster-key": api_key
      });

    if (!response?.body?.status === "success") {
      throw new Error(response?.body?.error);
    }

    return {
      status: 200,
      data: {
        label: "Phantoms",
        options: (response?.body?.data?.agents || []).map(({ id, name }) => ({
          value: id.toString(),
          label: name
        }))
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

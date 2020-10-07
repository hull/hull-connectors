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
      .type("json")
      .set({
        "x-phantombuster-key": api_key
      })
      .get("/agents/fetch-all");

    const { ok, error, body } = response;
    if (!body || !ok || error) {
      throw new Error(error);
    }

    return {
      status: 200,
      data: {
        label: "Phantoms",
        options: body.map(({ id, name }) => ({
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

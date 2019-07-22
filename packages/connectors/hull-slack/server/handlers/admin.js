// @flow
import type { HullContext, HullExternalResponse } from "hull";

async function admin(ctx: HullContext): HullExternalResponse {
  const { private_settings = {} } = ctx.connector;
  const { token, bot = {} } = private_settings;
  const { bot_access_token } = bot;
  const credentials = !!bot_access_token && !!token;
  return {
    status: 200,
    pageLocation: "home.html",
    data: {
      credentials
    }
  };
}

export default admin;

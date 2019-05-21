// @flow
import _ from "lodash";
import type { HullContext, HullExternalResponse } from "hull";

async function admin(ctx: HullContext): HullExternalResponse {
  const { private_settings } = ctx.connector;
  const credentials =
    !!_.get(private_settings, "oauth.bot.bot_access_token") &&
    !!_.get(private_settings, "oauth.token");
  return {
    status: 200,
    pageLocation: "home.html",
    data: {
      credentials
    }
  };
}

export default admin;

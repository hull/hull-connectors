// @flow
import type { HullContext, HullExternalResponse } from "hull";

async function admin(ctx: HullContext): HullExternalResponse {
  const { private_settings } = ctx.connector;
  return {
    status: 200,
    pageLocation: "home.html",
    data: {
      settings: private_settings
    }
  };
}

export default admin;

/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const debug = require("debug")("hull-outreach:adminHandler");

async function adminHandler(ctx: HullContext): HullExternalResponse {
  debug("Rendering adminHandler");
  return {
    status: 200,
    pageLocation: "home.html",
    data: {
      name: "Outreach.io"
    }
  };
}

module.exports = adminHandler;

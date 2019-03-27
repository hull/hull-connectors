/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const debug = require("debug")("hull-outreach:adminHandler");

function adminHandler(ctx: HullContext): Promise<HullExternalResponse> {
  debug("Rendering adminHandler");
  return Promise.resolve({
    status: 200,
    pageLocation: "home.html",
    data: {
      name: "Outreach.io"
    }
  });
}

module.exports = adminHandler;

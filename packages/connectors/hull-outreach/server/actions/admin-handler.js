/* @flow */

const debug = require("debug")("hull-outreach:adminHandler");

function adminHandler(ctx) {
  debug("Rendering adminHandler");
  return Promise.resolve({
    pageLocation: "home.html",
    data: {
      name: "Outreach.io"
    }
  });
}

module.exports = adminHandler;

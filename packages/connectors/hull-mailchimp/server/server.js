/* @flow */
import type { $Application } from "express";

const appRouter = require("./router/app");
// const oAuthRouter = require("./router/oauth");

function server(app: $Application): $Application {
  app.use("/", appRouter());
  // .use("/auth", oAuthRouter(options))
  return app;
}

module.exports = server;

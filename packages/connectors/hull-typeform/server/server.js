/* @flow */
const cors = require("cors");
const express = require("express");
const { jsonHandler, scheduleHandler } = require("hull/src/handlers");

const actions = require("./actions");
// const appMiddleware = require("./lib/app-middleware");

function server(app: express): express {
  app.use("/admin", actions.authorization);
  app.use("/refresh-access-token", scheduleHandler(actions.refreshAccessToken));
  app.use("/fetch-all-responses", jsonHandler(actions.fetchAllResponses));
  app.use("/fetch", scheduleHandler(actions.fetchRecentResponses));
  app.use(
    "/fetch-recent-responses",
    scheduleHandler(actions.fetchRecentResponses)
  );
  app.use("/schema/forms", cors(), jsonHandler(actions.getForms));
  app.use(
    "/schema/fields/email",
    cors(),
    jsonHandler(actions.getEmailQuestions)
  );
  app.use("/schema/fields", cors(), jsonHandler(actions.getQuestions));
  return app;
}

module.exports = server;

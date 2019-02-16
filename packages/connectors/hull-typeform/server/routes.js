/* @flow */
import type { Connector } from "hull";

const cors = require("cors");
const { jsonHandler, scheduleHandler } = require("hull/src/handlers");

const {
  authorization,
  refreshAccessToken,
  fetchAllResponses,
  fetchRecentResponses,
  getForms,
  getEmailQuestions,
  getQuestions
} = require("./actions");
// const appMiddleware = require("./lib/app-middleware");

function server(connector: Connector) {
  const { app } = connector;

  app.use("/admin", authorization);
  app.use("/refresh-access-token", scheduleHandler(refreshAccessToken));
  app.use("/fetch-all-responses", jsonHandler(fetchAllResponses));

  app.use(
    "/fetch",
    scheduleHandler({
      callback: fetchRecentResponses,
      options: {
        fireAndForget: true
      }
    })
  );
  app.use(
    "/fetch-recent-responses",
    scheduleHandler({
      callback: fetchRecentResponses,
      options: {
        fireAndForget: true
      }
    })
  );

  app.use("/schema/forms", cors(), jsonHandler(getForms));
  app.use("/schema/fields/email", cors(), jsonHandler(getEmailQuestions));
  app.use("/schema/fields", cors(), jsonHandler(getQuestions));
  return app;
}

module.exports = server;

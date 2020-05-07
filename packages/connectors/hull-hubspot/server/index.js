// @flow

import Hull from "hull";
import config from "./config";

new Hull.Connector(config).start();

process.on("uncaughtExceptionMonitor", function(err, origin) {
  console.error("-------------------------");
  console.error("uncaughtException :", err);
  console.error("Exception origin :", origin);
  console.error(err.stack);
  console.error("-------------------------");
});

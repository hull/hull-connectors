// @flow

import { Connector } from "hull";
import config from "./config";

new Connector(config).start();

process.on("uncaughtExceptionMonitor", function uncaughtExceptionMonitor(
  err,
  origin
) {
  console.error("-------------------------");
  console.error("uncaughtException :", err);
  console.error("Exception origin :", origin);
  console.error(err.stack);
  console.error("-------------------------");
});

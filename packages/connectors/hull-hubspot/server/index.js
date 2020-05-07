// @flow

import Hull from "hull";
import config from "./config";

new Hull.Connector(config).start();

process.on("uncaughtException", function(err) {
  console.warn("uncaughtException", err);
  console.error(err.stack);
  console.log("Node NOT Exiting... !");
});

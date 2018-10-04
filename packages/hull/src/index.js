/* @flow */
/*:: export * from type "./types"; */
/*:: export * from type "../../hull-client/src"; */

const HullClient = require("../../hull-client/src");

const Worker = require("./connector/worker");
const HullConnector = require("./connector/hull-connector");

const boundHullConnector = HullConnector.bind(undefined, {
  Worker,
  HullClient
});

module.exports = {
  Connector: boundHullConnector,
  Client: HullClient
};

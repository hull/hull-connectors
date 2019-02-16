/* @flow */
import type { HullConnector } from "hull";

const jobs = require("./jobs");

function worker(connector: HullConnector) {
  connector.worker(jobs);
}

module.exports = worker;

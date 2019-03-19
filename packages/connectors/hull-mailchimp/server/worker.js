/* @flow */
import type { Connector } from "hull";

const jobs = require("./jobs");

function worker(connector: Connector) {
  connector.worker(jobs);
}

module.exports = worker;

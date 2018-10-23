/* @flow */
const { Connector } = require("hull");

const jobs = require("./jobs");

function worker(connector: Connector) {
  connector.worker(jobs);
}

module.exports = worker;

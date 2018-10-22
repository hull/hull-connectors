/* @flow */
const jobs = require("./jobs");

function worker(connector) {
  connector.worker(jobs);
}

module.exports = worker;

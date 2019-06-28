import { expect } from "chai";

const _ = require("lodash");

module.exports = function captureOutput({
  done,
  skipMessages = [],
  expectation = {}
}) {
  const originalWrite = process.stdout.write;
  process.stdout.write = log => {
    try {
      const logLine = JSON.parse(log);
      if (_.includes(skipMessages, logLine.message)) {
        return;
      }
      process.stdout.write = originalWrite;
      _.map(expectation, (value, key) =>
        expect(_.get(logLine, key)).to.equal(value)
      );
      done();
    } catch (err) {
      console.log(log);
    }
  };
};

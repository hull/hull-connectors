/* @flow */
const Factory = require("rosie").Factory;
const faker = require("faker");
const _ = require("lodash");

module.exports = new Factory()
  .attr("user", () => {
    return {
      id: faker.random.uuid(),
      email: "foo@bar.com"
    };
  })
  .attr("segments", ["segments"], (segments: Array<string>) => {
    if (_.isNil(segments)) {
      return [];
    }
    return segments.map((segmentId) => {
      return {
        id: segmentId,
        mame: `Name ${segmentId}`
      };
    });
  })
  .attr("account_segments", ["account_segments"], (account_segments: Array<string>) => {
    if (_.isNil(account_segments)) {
      return [];
    }
    return account_segments.map((segmentId) => {
      return {
        id: segmentId,
        mame: `Name ${segmentId}`
      };
    });
  })
  .attr("account", ["withAccount"], (withAccount: boolean = false) => {
    if (withAccount === true) {
      return {
        id: "123123123123123",
        domain: "bar.com"
      };
    }
    return undefined;
  });

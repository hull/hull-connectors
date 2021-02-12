/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

const expect = require("expect");

describe("Intercom Webhook Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../../server/glue"),
    {
      intercom: require("../../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    _.concat(
      require("../../../server/transforms-to-hull"),
      require("../../../server/transforms-to-service")
    ),
    "ensure");

  expect.extend({
    toBeWithinRange(received, floor, ceiling) {
      const pass = received >= floor && received <= ceiling;
      if (pass) {
        return {
          message: () =>
            `expected ${received} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },
  });

  it("invitee.created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-invitee-created"));
  });

  it("invitee.canceled webhook", () => {
    return harness.runTest(require("./fixtures/webhook-invitee-canceled"));
  });

});

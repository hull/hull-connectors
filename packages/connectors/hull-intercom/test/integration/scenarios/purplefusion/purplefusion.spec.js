/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

const expect = require("expect");

describe("Intercom Webhook Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../../../server/glue"),
    {
      intercom: require("../../../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    _.concat(
      require("../../../../server/transforms-to-hull"),
      require("../../../../server/transforms-to-service")
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

  it("company created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-company-created"));
  });

  it("lead created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-created"));
  });

  it("lead added email webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-added-email"));
  });

  it("lead tag created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-tag-created"));
  });

  it("lead tag deleted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-lead-tag-deleted"));
  });

  it("user added email webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-email-updated"));
  });

  it("user created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-created"));
  });

  it("user tag deleted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-tag-deleted"));
  });

  it("user tag created webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-tag-created"));
  });

  it("user deleted webhook", () => {
    return harness.runTest(require("./fixtures/webhook-user-deleted"));
  });

});

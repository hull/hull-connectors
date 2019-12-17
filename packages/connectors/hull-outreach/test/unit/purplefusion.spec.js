/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Outreach User Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      outreach: require("../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    _.concat(
      require("../../server/transforms-to-hull"),
      require("../../server/transforms-to-service")
    ),
    "ensureWebhooks");


  it("outgoing outreach user", () => {
    return harness.runTest(require("./fixtures/userUpdateStart"));
  });

  it("incoming outreach webhook", () => {
    return harness.runTest(require("./fixtures/webhook"));
  });

  it("delete outreach bad webhooks", () => {
    return harness.runTest(require("./fixtures/delete-bad-webhooks"));
  });

  it("fetch all events", () => {
    return harness.runTest(require("./fixtures/getEvents"));
  });
});

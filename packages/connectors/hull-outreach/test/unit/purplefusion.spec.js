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

  it("fetch recent events with paging", () => {
    return harness.runTest(require("./fixtures/getRecentEvents"));
  });

  it("Fetch different glue endpoints twice to test caching", () => {
    return harness.runTest(require("./fixtures/testCaching"));
  });

  // outgoing segment property tests
  it("outgoing outreach user with segments as tags and custom 1", () => {
    return harness.runTest(require("./fixtures/userUpdateSegments"));
  });
  it("outgoing outreach user with segments as tags and custom 1 reversed user/accounts segments outgoing mapping", () => {
    return harness.runTest(require("./fixtures/userUpdateSegments2"));
  });
  it("outgoing outreach accounts with segments as tags", () => {
    return harness.runTest(require("./fixtures/accountUpdateSegments"));
  });
  it("outgoing outreach accounts with segments as custom1 which is a string", () => {
    return harness.runTest(require("./fixtures/accountUpdateSegments2"));
  });
});

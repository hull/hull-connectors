/* @flow */
const _ = require("lodash");
const MockDate = require("mockdate");
const moment = require("moment");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Marketo User Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      marketo: require("../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    _.concat(
      require("../../server/transforms-to-hull"),
      require("../../server/transforms-to-service")
    ),
    "ensureSetup");

  it("status unconfigured", () => {
    return harness.runTest(require("./fixtures/status-unconfigured"));
  });
  it("fetching activity", () => {
    return harness.runTest(require("./fixtures/fetchRecentLeadActivityWithEvents"));
  });
  it("fetching activity no events", () => {
    return harness.runTest(require("./fixtures/fetchRecentLeadActivityWithNoEvents"));
  });
  it("upsert user", () => {
    return harness.runTest(require("./fixtures/userUpdate"));
  });
  it("upsert user fail", () => {
    return harness.runTest(require("./fixtures/userUpdate-fail"));
  });

});

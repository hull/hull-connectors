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

  it("fetchRecentLeadActivity", () => {
    MockDate.set(moment.parseZone("2019-08-06T17:44:03-04:00"));
    return harness.runTest(require("./fixtures/fetchRecentLeadActivity1"))
      .then((results) => {
        MockDate.reset();
        return Promise.resolve(results);
      });
  });

});

/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Outreach User Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      pipedrive: require("../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    require("../../server/transforms-to-hull"),
    "ensureHook");


  it("fetch pipedrive users", () => {
    return harness.runTest(require("./fixtures/fetch-all"));
  });
});

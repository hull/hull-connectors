/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Pipedrive User Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      pipedrive: require("../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    _.concat(require("../../server/transforms-to-hull"),
    require("../../server/transforms-to-service")),
    "ensureWebhooks");


  it("fetch pipedrive users", () => {
    return harness.runTest(require("./fixtures/fetch-all"));
  });

  it("incoming user webhook from pipedrive", () => {
    return harness.runTest(require("./fixtures/user-webhook-update"));
  });
});

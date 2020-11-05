/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Bigquery unit tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      bigquery: require("../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    [],
    "ensure");


  it("tests variable replacement", () => {
    return harness.runTest(require("./fixtures/query-replacement"));
  });
});

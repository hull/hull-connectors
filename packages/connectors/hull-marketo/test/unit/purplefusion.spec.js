/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Marketo User Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    { marketo: require("../../server/service") },
    _.concat(
      require("../../server/transforms-to-hull"),
      require("../../server/transforms-to-service")
    ),
    "ensureSetup");

  it("status unconfigured", () => {
    return harness.runTest(require("./fixtures/status-unconfigured"));
  });

});

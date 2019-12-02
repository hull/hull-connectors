/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Zapier User Events Tests", () => {

  const testDefinition = require("./fixtures/user-events");

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      zapier: require("../../server/service")()
    },
    _.concat(
      require("../../server/transforms-to-hull"),
      require("../../server/transforms-to-service")
    ),
    "");


  it("Receive Request for User Events", () => {
    const userSegmentsTest = _.cloneDeep(testDefinition);
    return harness.runTest(userSegmentsTest);
  });
});

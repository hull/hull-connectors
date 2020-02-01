/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Zapier User Segments Tests", () => {

  const testDefinition = require("./fixtures/user-segments");

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


  it("Receive Request for User Segments", () => {
    const userSegmentsTest = _.cloneDeep(testDefinition);
    return harness.runTest(userSegmentsTest);
  });
});

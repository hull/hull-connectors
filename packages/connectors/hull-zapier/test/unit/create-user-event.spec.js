/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Zapier Create User Tests", () => {

  const testDefinition = require("./fixtures/create-user-event");

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


  it("Receive Request to Create Hull User", () => {
    const userSegmentsTest = _.cloneDeep(testDefinition);
    return harness.runTest(userSegmentsTest);
  });
});

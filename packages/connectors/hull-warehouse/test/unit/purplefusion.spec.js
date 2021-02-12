/* @flow */
const _ = require("lodash");

const {
  PurpleFusionTestHarness
} = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Warehouse User Tests", () => {
  let harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    { postgres: require("../../server/postgres-sequalize-service")() },
    [],
    "ensureHook"
  );

  it("test unconfigured status", () => {
    return harness.runTest(require("./fixtures/status-notconfigured"));
  });

  it("test merge event", () => {
    return harness.runTest(require("./fixtures/outgoing-merge-event"));
  });

  harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    { postgres: require("../../server/postgres-sequalize-service")() },
    require("../../server/transforms-to-service"),
    ""
  );

  it("test account upsert with filtered columns", () => {
    return harness.runTest(require("./fixtures/upsert-account-filtered"));
  });

  it("test account upsert all account attributes ", () => {
    return harness.runTest(require("./fixtures/upsert-account-send-all-attributes"));
  });

  it("test user upsert with filtered columns and whitelisted events", () => {
    return harness.runTest(require("./fixtures/upsert-user-filtered"));
  });

  it("test user upsert all events", () => {
    return harness.runTest(require("./fixtures/upsert-all-user-events"));
  });

  it("test user upsert all user attributes and events", () => {
    return harness.runTest(require("./fixtures/upsert-user-send-all-attributes"));
  });
});

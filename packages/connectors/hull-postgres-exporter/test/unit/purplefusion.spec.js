/* @flow */
const _ = require("lodash");

const {
  PurpleFusionTestHarness
} = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");

describe("Postgres Exporter User Tests", () => {
  let harness = new PurpleFusionTestHarness(
    require("hull-sql-exporter/server/glue"),
    { sql: require("hull-sql-exporter/server/sql-sequelize-service") },
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
    require("hull-sql-exporter/server/glue"),
    { sql: require("hull-sql-exporter/server/sql-sequelize-service") },
    require("hull-sql-exporter/server/transforms-to-service"),
    ""
  );

  it("test account upsert with filtered columns", () => {
    return harness.runTest(require("./fixtures/upsert-account-filtered"));
  });

  it("test user upsert with filtered columns and whitelisted events", () => {
    return harness.runTest(require("./fixtures/upsert-user-filtered"));
  });

  it("test user upsert all events", () => {
    return harness.runTest(require("./fixtures/upsert-all-user-events"));
  });
});

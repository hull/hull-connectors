// @flow
import type { HullConnectorConfig, HullManifest } from "hull";
import type { TestScenarioDefinition } from "./test-scenario-runner";

const TestScenarioRunner = require("./test-scenario-runner");

function testScenario(
  {
    manifest,
    connectorConfig,
    debounceWait
  }: {
    manifest: HullManifest,
    connectorConfig: () => HullConnectorConfig,
    debounceWait?: number
  },
  scenarioDefinition: TestScenarioDefinition
): Promise<*> {
  return new TestScenarioRunner(
    { manifest, connectorConfig, debounceWait },
    scenarioDefinition
  ).run();
}

module.exports = testScenario;

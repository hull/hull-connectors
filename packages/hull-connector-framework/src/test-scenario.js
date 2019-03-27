// @flow
import type { HullConnectorConfig } from "hull";
import type { TestScenarioDefinition } from "./test-scenario-runner";

const TestScenarioRunner = require("./test-scenario-runner");

function testScenario(
  {
    connectorConfig,
    debounceWait
  }: {
    connectorConfig: HullConnectorConfig,
    debounceWait?: number
  },
  scenarioDefinition: TestScenarioDefinition
): Promise<*> {
  return new TestScenarioRunner(
    { connectorConfig, debounceWait },
    scenarioDefinition
  ).run();
}

module.exports = testScenario;

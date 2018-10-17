// @flow
import type { TestScenarioDefinition } from "./test-scenario-runner";

const TestScenarioRunner = require("./test-scenario-runner");

function testScenario(connectorServer, scenarioDefinition: TestScenarioDefinition): Promise<*> {
  const runner = new TestScenarioRunner(connectorServer, scenarioDefinition);
  return runner.run();
}

module.exports = testScenario;

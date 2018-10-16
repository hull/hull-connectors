// @flow
import type { TestScenarioDefinition } from "./test-scenario-runner";

const TestScenarioRunner = require("./test-scenario-runner");

function testScenario(scenarioDefinition: TestScenarioDefinition): Promise<*> {
  const runner = new TestScenarioRunner(scenarioDefinition);
  return runner.run();
}

module.exports = testScenario;

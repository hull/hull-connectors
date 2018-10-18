// @flow
import type { TestScenarioDefinition } from "./test-scenario-runner";

const express = require("express");
const TestScenarioRunner = require("./test-scenario-runner");

function testScenario(
  connectorServer: express => express,
  scenarioDefinition: TestScenarioDefinition
): Promise<*> {
  const runner = new TestScenarioRunner(connectorServer, scenarioDefinition);
  return runner.run();
}

module.exports = testScenario;

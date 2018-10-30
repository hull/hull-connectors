// @flow
import type { TestScenarioDefinition } from "./test-scenario-runner";

const express = require("express");
const TestScenarioRunner = require("./test-scenario-runner");

function testScenario(
  {
    connectorServer,
    connectorWorker
  }: {
    connectorServer: express => express,
    connectorWorker?: Function
  },
  scenarioDefinition: TestScenarioDefinition
): Promise<*> {
  const runner = new TestScenarioRunner(
    { connectorServer, connectorWorker },
    scenarioDefinition
  );
  return runner.run();
}

module.exports = testScenario;

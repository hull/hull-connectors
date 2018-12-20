// @flow
import type { TestScenarioDefinition } from "./test-scenario-runner";

const express = require("express");
const TestScenarioRunner = require("./test-scenario-runner");

function testScenario(
  {
    connectorServer,
    connectorWorker,
    connectorManifest,
    debounceWait
  }: {
    connectorServer: express => express,
    connectorWorker?: Function,
    connectorManifest: Object,
    debounceWait?: number
  },
  scenarioDefinition: TestScenarioDefinition
): Promise<*> {
  const runner = new TestScenarioRunner(
    { connectorServer, connectorWorker, connectorManifest, debounceWait },
    scenarioDefinition
  );
  return runner.run();
}

module.exports = testScenario;

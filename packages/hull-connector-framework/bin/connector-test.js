#!/usr/bin/env node
// @flow
// import type { IntegrationScenarioConfig } from "../src/integration-scenario-runner";

const debug = require("debug")(
  "hull-connector-framework:run-integration-scenarios"
);
const fs = require("fs");
const path = require("path");
const IntegrationScenarioRunner = require("../src/integration-scenario-runner");

const serverPath = path.join(process.cwd(), "server", "server");
const scenariosPath = path.join(
  process.cwd(),
  "test",
  "integration",
  "scenarios"
);

if (!fs.existsSync(scenariosPath)) {
  throw Error(`Scenarios directory not found: ${scenariosPath}`);
}
debug("scenariosPath", scenariosPath);
debug("serverPath", serverPath);

(async () => {
  // eslint-disable-next-line no-restricted-syntax
  for (const scenarioName of fs.readdirSync(scenariosPath)) {
    const scenarioPath = path.join(scenariosPath, scenarioName);
    const scenarioDefinition = require(scenarioPath); // eslint-disable-line
    const server = require(serverPath); // eslint-disable-line
    try {
      const runner = new IntegrationScenarioRunner(server, scenarioDefinition);
      await runner.run(); // eslint-disable-line
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(scenarioPath);
  }
  process.exit(0);
})();

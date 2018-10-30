// @flow
import type {
  HullHandlersConfiguration,
  HullNormalizedHandlersConfiguration
} from "../types";

const normalizeHandlersConfigurationEntry = require("./normalize-handlers-configuration-entry");

function normalizeHandlersConfiguration<C, O>(
  configuration: HullHandlersConfiguration<C, O>
): HullNormalizedHandlersConfiguration<C, O> {
  if (configuration === undefined) {
    throw new Error(
      "normalizeHandlersConfiguration requires configuration object"
    );
  }
  return Object.keys(configuration).reduce(
    (normConf: HullNormalizedHandlersConfiguration<C, O>, key: string) => {
      normConf[key] = normalizeHandlersConfigurationEntry(configuration[key]);
      return normConf;
    },
    {}
  );
}

module.exports = normalizeHandlersConfiguration;

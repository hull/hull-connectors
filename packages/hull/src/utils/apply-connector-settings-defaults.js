// @flow
import type { HullConnector } from "hull-client";

const debug = require("debug")("hull:apply-connector-settings-default");

function applyDefaults(manifestSettings = [], connectorSettings = {}) {
  manifestSettings.forEach(setting => {
    if (!setting.name || !setting.default) {
      return;
    }
    if (connectorSettings[setting.name] !== undefined) {
      return;
    }
    debug("applying default", {
      name: setting.name,
      currentValue: typeof connectorSettings[setting.name],
      defaultValue: setting.default
    });
    connectorSettings[setting.name] = setting.default;
  });
}

function applyConnectorSettingsDefaults(connector: HullConnector) {
  if (!connector || !connector.manifest) {
    debug("return early");
    return;
  }

  const { manifest } = connector;
  debug("picked from req", {
    connector: typeof connector,
    manifest: typeof manifest
  });

  applyDefaults(manifest.private_settings, connector.private_settings);
  applyDefaults(manifest.settings, connector.settings);
}

module.exports = applyConnectorSettingsDefaults;

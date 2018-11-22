// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequest } from "../types";

const debug = require("debug")("hull:connector-settings-defaults");

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

function connectorSettingsDefaultsMiddlewareFactory() {
  return function connectorSettingsDefaultsMiddleware(
    req: HullRequest,
    res: $Response,
    next: NextFunction
  ) {
    if (!req.hull.connector || !req.hull.connector.manifest) {
      debug("return early");
      return next();
    }
    const { connector } = req.hull;
    const { manifest } = connector;
    debug("picked from req", {
      connector: typeof connector,
      manifest: typeof manifest
    });

    applyDefaults(manifest.private_settings, connector.private_settings);
    applyDefaults(manifest.settings, connector.settings);
    return next();
  };
}

module.exports = connectorSettingsDefaultsMiddlewareFactory;

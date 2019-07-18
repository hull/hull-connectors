// @flow
import type { HullConnector } from "../types";

const debug = require("debug")("hull:trim-traits-prefix");
const _ = require("lodash");

function replace(key: string): string {
  return (key || "").replace(/^traits_/, "");
}

function performTrim(manifest = {}, connector = {}) {
  // trim top level string settings
  const topLevelStringSettings = _.filter(manifest, {
    format: "trait",
    type: "string"
  });
  debug("topLevelStringSettings", topLevelStringSettings.map(s => s.name));
  topLevelStringSettings.forEach(setting => {
    const { name } = setting;
    if (connector[name]) {
      connector[name] = replace(connector[name]);
    }
  });

  // trim top level arrray settings
  const topLevelArraySettings = _.filter(manifest, {
    format: "trait",
    type: "array"
  });
  debug("topLevelArraySettings", topLevelArraySettings.map(s => s.name));
  topLevelArraySettings.forEach(setting => {
    const { name } = setting;
    if (connector[name]) {
      connector[name] = connector[name].map(replace);
    }
  });

  // trim table settings
  const tableSettings = _.filter(manifest, {
    type: "array"
  });
  debug("tableSettings", tableSettings.map(s => s.name));
  tableSettings.forEach(setting => {
    const { name } = setting;
    if (
      setting &&
      setting.items &&
      setting.items.type === "object" &&
      setting.items.properties
    ) {
      const { properties } = setting.items;
      const keysToTrim = _.keys(
        _.pickBy(properties, {
          format: "trait",
          type: "string"
        })
      );
      debug("keysToTrim", keysToTrim);
      if (connector[name]) {
        connector[name] = connector[name].map(entry => {
          const newEntry = {
            ...entry
          };
          keysToTrim.forEach(key => {
            if (newEntry[key]) {
              newEntry[key] = replace(newEntry[key]);
            }
          });
          return newEntry;
        });
      }
    }
  });

  // trim trait-mapping
  const traitMappingSettings = _.filter(manifest, {
    format: "trait-mapping"
  }).concat(
    _.filter(manifest, {
      format: "traitMapping"
    })
  );
  debug("traitMappingSettings", traitMappingSettings.map(s => s.name));
  traitMappingSettings.forEach(setting => {
    const { name } = setting;
    if (connector[name]) {
      connector[name] = connector[name].map(entry => {
        const newEntry = {
          ...entry
        };
        if (newEntry.hull) {
          newEntry.hull = replace(entry.hull);
        }
        return newEntry;
      });
    }
  });
}

function trimTraitsPrefixFromConnector(connector: HullConnector) {
  if (!connector || !connector.manifest) {
    debug("return early");
    return;
  }
  const { manifest } = connector;
  debug("picked from req", {
    connector: typeof connector,
    manifest: typeof manifest
  });

  performTrim(manifest.private_settings, connector.private_settings);
  performTrim(manifest.settings, connector.settings);
}

module.exports = trimTraitsPrefixFromConnector;

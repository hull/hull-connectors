// @flow

import type { HullContext } from "hull";

const _ = require("lodash");

const ALIAS_SCRIPTS = {
  intercom_alias: "https://intercom.hullapp.com/ship.js",
  hubspot_utk_alias: "https://hubspot.hullapp.com/ship.js",
  google_analytics_alias: "https://google-analytics.hullapp.com/ship.js",
  facebook_alias: "https://facebook-audiences.hullapp.com/ship.js"
};

export default async (ctx: HullContext) => {
  const { connector, helpers } = ctx;
  const { private_settings } = connector;
  const { settingsUpdate } = helpers;
  const { alias_scripts = [] } = private_settings;

  const pendingScripts = [];

  _.forEach(ALIAS_SCRIPTS, (url, alias_script) => {
    if (private_settings[alias_script]) {
      pendingScripts.push(url);
    }
    return pendingScripts;
  });

  const symmetricDiff = _.xor(pendingScripts, alias_scripts);
  if (_.size(symmetricDiff)) {
    return settingsUpdate({
      alias_scripts: pendingScripts
    });
  }

  return Promise.resolve({});
};

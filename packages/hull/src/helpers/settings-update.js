// @flow
import type { HullConnector, HullContext } from "../types";

const {
  applyConnectorSettingsDefaults,
  trimTraitsPrefixFromConnector
} = require("../utils");

/**
 * Allows to update selected settings of the ship `private_settings` object. This is a wrapper over `hullClient.utils.settings.update()` call. On top of that it makes sure that the current context ship object is updated, and the ship cache is refreshed.
 * It will emit `ship:update` notify event.
 *
 * @public
 * @name updateSettings
 * @memberof Utils
 * @param {Object} ctx The Context Object
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 * @example
 * req.hull.helpers.settingsUpdate({ newSettings });
 */
const settingsUpdate = (ctx: HullContext) => async (
  newSettings: $PropertyType<HullConnector, "private_settings">
): void | Promise<HullConnector> => {
  const { client, cache } = ctx;
  try {
    const connector = await client.utils.settings.update(newSettings);
    applyConnectorSettingsDefaults(connector);
    trimTraitsPrefixFromConnector(connector);
    ctx.connector = connector;
    if (!cache) {
      return connector;
    }
    await cache.del("connector");
    return connector;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

module.exports = settingsUpdate;

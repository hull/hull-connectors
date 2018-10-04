// @flow

import type { HullConnector, HullConnectorSettings } from "../types";

/**
 * Updates `private_settings` merging them with existing ones before.
 *
 * Note: this method will trigger `hullClient.put` and will result in `ship:update` notify event coming from Hull platform - possible loop condition.
 * @memberof Utils
 * @method   settings.update
 * @public
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 */
function update(newSettings: HullConnectorSettings): Promise<HullConnector> {
  return this.get("app").then((connector: HullConnector) => {
    const private_settings: HullConnectorSettings = {
      ...connector.private_settings,
      ...newSettings
    };
    connector.private_settings = private_settings;
    return this.put(connector.id, { private_settings });
  });
}

module.exports = {
  update
};

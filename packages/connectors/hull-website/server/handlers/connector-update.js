// @flow

import type { HullContext } from "hull";
import _ from "lodash";
import typeof SocketIO from "socket.io";
import type { Store } from "../../types";
import namespaceOriginMiddleware from "../lib/namespace-origin-middleware";

export type ConnectorUpdateFunction = (ctx: HullContext) => Promise<void>;

const ALIAS_SCRIPTS = {
  intercom_alias: "https://intercom.hullapp.com/alias.js",
  hubspot_utk_alias: "https://hubspot.hullapp.com/alias.js",
  google_analytics_alias: "https://google-analytics.hullapp.com/alias.js",
  facebook_alias: "https://facebook-audiences.hullapp.com/alias.js"
};

export default function connectorUpdateFactory({
  store,
  onConnection,
  io
}: {
  store: Store,
  onConnection: () => any,
  io: SocketIO
}): ConnectorUpdateFunction {
  return async function connectorUpdate(ctx: HullContext) {
    const { connector = {}, clientCredentialsEncryptedToken, helpers } = ctx;
    const { settingsUpdate } = helpers;
    const { private_settings } = connector;
    const { alias_scripts = [] } = private_settings;

    /* Update the settings to have all scripts (not sure I understand this) */
    const pending_scripts = _.reduce(
      ALIAS_SCRIPTS,
      (sc, url, script_name) => {
        if (private_settings[script_name]) {
          sc.push(url);
        }
        return sc;
      },
      []
    );

    const symmetricDiff = _.xor(pending_scripts, alias_scripts);

    if (_.size(symmetricDiff)) {
      await settingsUpdate({ alias_scripts: pending_scripts });
      return;
    }

    const { id } = connector;
    if (!id) {
      throw new Error("Could not find a connector ID in the received payload");
    }
    await store.setup(ctx /* , io */);
    if (store.pool(id)) return;
    ctx.client.logger.info("Initializing Websocket Namespace with connector", {
      id
    });
    const namespace = io
      .of(id)
      .on("connection", onConnection(clientCredentialsEncryptedToken));
    namespace.use(namespaceOriginMiddleware(ctx));
    store.pool(id, namespace);
  };
}

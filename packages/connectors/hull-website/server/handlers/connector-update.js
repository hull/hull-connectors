import type { HullContext } from "hull";
// @flow
import typeof SocketIO from "socket.io";
import type { Store } from "../../types";
import namespaceOriginMiddleware from "../lib/namespace-origin-middleware";

export type ConnectorUpdateFunction = (ctx: HullContext) => Promise<void>;

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
    const { connector = {}, clientCredentialsEncryptedToken } = ctx;

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

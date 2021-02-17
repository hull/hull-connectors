// @flow

import type {
  HullClient,
  HullContext,
  HullContextGetter,
  HullEntityScopedClient,
  HullFetchedUser
} from "hull";

import _ from "lodash";
import type { Store } from "../../types";

const USER_NOT_FOUND = {
  message: "not_found",
  user: {},
  account: {},
  segments: {}
};

const getRoom = (q = {}) => q.id || q.external_id || q.email || q.anonymous_id;

const logAndClose = (socket, Client) => (
  action: string = "incoming.user.fetch.error",
  message: string = "closing connection",
  client: Class<HullClient> | HullClient | HullEntityScopedClient = Client
) => {
  client.logger.error(action, { message });
  socket.emit("close", { message });
  setTimeout(() => {
    socket.disconnect(true);
  }, 200);
};

export default function onConnectionFactory({
  getContext,
  store,
  sendPayload
}: {
  getContext: HullContextGetter,
  sendPayload: (HullContext, HullFetchedUser, any) => void,
  store: Store
}) {
  const { lru } = store;
  return clientCredentialsEncryptedToken => {
    return async function onConnection(socket: any) {
      const ctx: HullContext = await getContext({
        clientCredentialsEncryptedToken
      });
      const { client } = ctx;

      // socket.emit("credentials.update", {
      //   token: clientCredentialsEncryptedToken
      // });

      const logClose = logAndClose(socket, client);

      socket.on("user.fetch", async function onUserFetch({ claims = {} }) {
        const connectorId = socket.nsp.name.replace("/", "");
        try {
          if (!_.size(claims)) {
            return logClose(
              "user.fetch.error",
              `Empty Claims (${connectorId})`
            );
          }

          const userClient = client.asUser(claims, { scopes: ["admin"] });

          // Only join one room to avoid multi-posting
          const room = getRoom(claims);

          userClient.logger.info("incoming.user.joinRoom", room);
          socket.join(room);
          socket.emit("room.joined", room);

          userClient.logger.info("incoming.user.fetch.start", claims);

          try {
            let user;
            // If we have a Hull ID, then can use LRU.
            // Othwerwise, we wait for the Update to send through websockets.
            if (claims.id) {
              user = await lru(connectorId).get(claims.id);
            }

            if (!user) {
              socket.emit("cache.miss", { connectorId, claims });
              const payloads = await ctx.entities.get({
                claims,
                entity: "user",
                include: { events: false }
              });
              user = _.first(payloads?.data || []);
            }

            if (user) {
              return sendPayload(ctx, user, socket);
            }
            client.logger.error("incoming.user.fetch.error", {
              user,
              claims
            });
            throw new Error("Can't find user");
          } catch (err) {
            // Error happened, send no one.
            socket.emit("user.error", USER_NOT_FOUND);
            logClose("incoming.user.error", err.message, client);
            throw err;
          }
        } catch (err) {
          client.logger.error("incoming.user.fetch.error", { message: err });
          // Don't throw this error, just return silently
          // throw err;
        }
        return true;
      });
    };
  };
}

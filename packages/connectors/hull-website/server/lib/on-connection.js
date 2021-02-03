// @flow

import type {
  HullClient,
  HullContext,
  HullContextGetter,
  HullEntityScopedClient,
  HullFetchedUser
} from "hull";

import URI from "urijs";
import _ from "lodash";
import type { Store } from "../../types";

const USER_NOT_FOUND = {
  message: "not_found",
  user: {},
  account: {},
  segments: {}
};

const getIdentifier = (q = {}) =>
  q.id || q.external_id || q.email || q.anonymous_id;

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

const isWhitelisted = (domains, hostname) =>
  _.includes(
    _.map(domains, d =>
      URI(`https://${d.replace(/http(s)?:\/\//, "")}`).hostname()
    ),
    hostname
  );

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
      const { client, connector } = ctx;

      const { private_settings = {} } = connector;
      const { whitelisted_domains = [] } = private_settings;

      // socket.emit("credentials.update", {
      //   token: clientCredentialsEncryptedToken
      // });

      const logClose = logAndClose(socket, client);

      socket.on("user.fetch", async function onUserFetch({ claims = {} }) {
        const connectorId = socket.nsp.name.replace("/", "");
        try {
          client.logger.debug("incoming.connection.start", {});

          if (!_.size(claims)) {
            return logClose(
              "incoming.connection.error",
              `Empty Claims (${connectorId})`
            );
          }

          const { origin } = socket.request.headers;

          if (!origin) {
            return logClose(
              "incoming.connection.error",
              `Not connecting socket: No Origin (${connectorId})`
            );
          }

          const userClient = client.asUser(claims, { scopes: ["admin"] });

          if (!whitelisted_domains.length) {
            return logClose(
              "incoming.connection.error",
              "No whitelisted domains",
              userClient
            );
          }

          userClient.logger.debug("incoming.connection.check", { origin });

          // Only continue if domain is whitelisted.
          const hostname = URI(origin).hostname();
          const whitelisted = isWhitelisted(whitelisted_domains, hostname);

          if (!whitelisted) {
            return logClose(
              "incoming.connection.error",
              `Unauthorized domain ${hostname}. Authorized: ${JSON.stringify(
                _.map(whitelisted_domains, d => URI(d).hostname())
              )}`,
              client
            );
          }

          // Starting the actual outgoing data sequence
          userClient.logger.info("incoming.connection.success");

          // Only join one room to avoid multi-posting
          const identifier = getIdentifier(claims);

          userClient.logger.info("incoming.user.joinRoom", identifier);
          socket.join(identifier);
          socket.emit("room.joined", identifier);

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

// @flow

import URI from "urijs";
import _ from "lodash";
import type { HullClient, HullContextGetter, HullEntityScopedClient } from "hull";
import fetchUser from "./fetch-user";
import type { Store } from "../../types";

const USER_NOT_FOUND = {
  message: "not_found",
  user: {},
  account: {},
  segments: {}
};

const getIdentifier = (q = {}) =>
  q.id || q.external_id || q.email || q.anonymous_id;

const loggerFactory = (socket, Client) => (
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

export default function socketFactory({
  getContext,
  store,
  sendPayload
}: {
  getContext: HullContextGetter,
  sendPayload: Object => void,
  store: Store
}) {
  const { get, lru } = store;

  return async function onConnection(socket: any) {
    const { client } await getContext({

    })
    const logClose = loggerFactory(socket, Client);
    Client.logger.debug("incoming.connection.start", {});

    async function onUserFetch({ token, /* platformId, */ claims = {} }) {
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
          `Not connecting socket: No Origin (${token})`
        );
      }

      try {
        // There's probably a simpler way to access a connector ship cache...
        const ctx = await getContext({ token });
        const { connector, client } = ctx;
        const { private_settings = {} } = connector;
        const { whitelisted_domains = [] } = private_settings;
        const userClient = client.asUser(claims, { scopes: ["admin"] });

        if (!whitelisted_domains.length) {
          return logClose(
            "incoming.connection.error",
            "No whitelisted domains",
            userClient
          );
        }

        userClient.logger.debug("incoming.connection.check", {
          origin: URI(origin).hostname()
        });

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
          let payload;
          // If we have a Hull ID, then can use LRU. Othwerwise, we wait for the Update to send through websockets.
          if (claims.id) {
            payload = await lru(connectorId).get(claims.id);
          }

          if (!payload) {
            socket.emit("cache.miss", { connectorId, claims });
            payload = await ctx.entities.user.get({ claims });
          }

          if (!payload) {
            throw new Error("Can't find user");
          }

          // Once joined, send payload.
          userClient.logger.info("incoming.user.fetch.success");

          sendPayload({ client: userClient, ship, ...payload });
        } catch (err) {
          // Error happened, send no one.
          socket.emit("user.error", USER_NOT_FOUND);
          logClose("incoming.user.error", err.message, client);
          throw err;
        }
      } catch (err) {
        Client.logger.error("incoming.user.fetch.error", { message: err });
        throw err;
      }
      return true;
    }

    socket.on("user.fetch", onUserFetch);
  };
}

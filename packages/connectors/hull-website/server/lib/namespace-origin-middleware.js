// @flow
import type { HullContext } from "hull";
import URI from "urijs";
import _ from "lodash";

const isWhitelisted = (domains, hostname) =>
  _.includes(
    _.map(domains, d =>
      URI(`https://${d.replace(/http(s)?:\/\//, "")}`).hostname()
    ),
    hostname
  );

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

export default function namespaceOriginMiddleware(ctx: HullContext) {
  const { connector = {}, client } = ctx;
  const { private_settings = {} } = connector;
  const { whitelisted_domains = [] } = private_settings;
  return (socket, next) => {
    const connectorId = socket.nsp.name.replace("/", "");
    const { origin } = socket.request.headers;
    const logClose = logAndClose(socket, client);

    client.logger.debug("incoming.connection.start", {});

    if (!whitelisted_domains.length) {
      return logClose(
        "incoming.connection.error",
        "No whitelisted domains",
        client
      );
    }

    if (!origin) {
      return logClose(
        "incoming.connection.error",
        `Not connecting socket: No Origin (${connectorId})`
      );
    }

    client.logger.debug("incoming.connection.check", { origin });

    // Only continue if domain is whitelisted.
    const hostname = URI(origin).hostname();
    const whitelisted = isWhitelisted(whitelisted_domains, hostname);

    if (!whitelisted) {
      const errMsg = `Unauthorized domain ${hostname}. Authorized: ${JSON.stringify(
        _.map(whitelisted_domains, d => URI(d).hostname())
      )}`;
      logClose("incoming.connection.error", errMsg, client);
      return next(new Error(errMsg));
    }

    // Starting the actual outgoing data sequence
    client.logger.info("incoming.connection.success");

    return next();
  };
}

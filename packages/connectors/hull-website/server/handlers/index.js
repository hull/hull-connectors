// @flow
import type {
  HullHandlersConfiguration,
  Connector,
  HullFirehoseKafkaTransport
} from "hull";
import bluebird from "bluebird";
import Redis from "redis";
import SocketIO from "socket.io";
import socketIOredis from "socket.io-redis";
import Store from "../lib/store";
import statusHandlerFactory from "./status";
import userUpdateFactory from "./user-update";
import connectorUpdateFactory from "./connector-update";
import onConnectionFactory from "../lib/on-connection";
import sendPayloadFactory from "../lib/send-payload";
import credentialsHandler from "./credentials-handler";

import legacyV1ApiCompatibility from "./legacy-v1-api-compatibility";

bluebird.promisifyAll(Redis.RedisClient.prototype);
bluebird.promisifyAll(Redis.Multi.prototype);

const handlers = ({
  redisUri,
  firehoseTransport,
  HULL_DOMAIN,
  REMOTE_DOMAIN
}: {
  redisUri: string,
  firehoseTransport: HullFirehoseKafkaTransport
}) => async (connector: Connector): HullHandlersConfiguration => {
  const { app, server, Client, getContext } = connector;
  const redis = Redis.createClient(redisUri);
  const store = Store(redis);
  const io = SocketIO(server, {
    pingInterval: 15000,
    pingTimeout: 30000
  }).adapter(socketIOredis(redisUri));
  const sendPayload = sendPayloadFactory({ io });
  const onConnection = onConnectionFactory({
    Client,
    getContext,
    store,
    sendPayload
  });
  const connectorUpdate = connectorUpdateFactory({ store, onConnection, io });
  const userUpdate = userUpdateFactory({ connectorUpdate, sendPayload, store });

  app.use(
    "/api/v1",
    legacyV1ApiCompatibility(firehoseTransport, HULL_DOMAIN, REMOTE_DOMAIN)
  );

  return {
    statuses: {
      statusHandler: statusHandlerFactory({ store })
    },
    subscriptions: {
      connectorUpdate,
      userUpdate
    },
    json: {
      credentialsHandler: credentialsHandler(REMOTE_DOMAIN)
    }
  };
};

export default handlers;

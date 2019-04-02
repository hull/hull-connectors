// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import bluebird from "bluebird";
import Redis from "redis";
import SocketIO from "socket.io";
import socketIOredis from "socket.io-redis";
import Store from "../lib/store";
import statusHandlerFactory from "./status-handler";
import userUpdateFactory from "./user-update";
import connectorUpdateFactory from "./connector-update";
import socketFactory from "../lib/socket-factory";
import sendPayloadFactory from "../lib/send-payload";
import adminHandler from "./admin-handler";

bluebird.promisifyAll(Redis.RedisClient.prototype);
bluebird.promisifyAll(Redis.Multi.prototype);

const handlers = ({ redisUri }: { redisUri: string }) => (
  connector: Connector
): HullHandlersConfiguration => {
  const { server, Client } = connector;
  const redis = Redis.createClient(redisUri);
  const store = Store(redis);
  const io = SocketIO(server, {
    pingInterval: 15000,
    pingTimeout: 30000
  }).adapter(socketIOredis(redisUri));
  const sendPayload = sendPayloadFactory({ io });
  const onConnection = socketFactory({
    Client,
    store,
    sendPayload
  });
  const connectorUpdate = connectorUpdateFactory({ store, onConnection, io });
  const userUpdate = userUpdateFactory({ connectorUpdate, sendPayload, store });

  return {
    statuses: {
      statusHandler: statusHandlerFactory({ store })
    },
    tabs: {
      adminHandler
    },
    subscriptions: {
      connectorUpdate
    },
    notifications: {
      connectorUpdate,
      userUpdate
    }
  };
};

export default handlers;

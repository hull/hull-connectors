// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import bluebird from "bluebird";
import Redis from "redis";
import SocketIO from "socket.io";
import socketIOredis from "socket.io-redis";
import Store from "../lib/store";
import statusHandlerFactory from "./status";
import userUpdateFactory from "./user-update";
import connectorUpdateFactory from "./connector-update";
import socketFactory from "../lib/socket-factory";
import sendPayloadFactory from "../lib/send-payload";
import credentialsHandler from "./credentials-handler";

bluebird.promisifyAll(Redis.RedisClient.prototype);
bluebird.promisifyAll(Redis.Multi.prototype);

const handlers = ({ redisUri }: { redisUri: string }) => async (
  connector: Connector
): HullHandlersConfiguration => {
  const { server, Client, getContext } = connector;
  // const ctx = await getContext({ token: "xxx" });
  const redis = Redis.createClient(redisUri);
  const store = Store(redis);
  const io = SocketIO(server, {
    pingInterval: 15000,
    pingTimeout: 30000
  }).adapter(socketIOredis(redisUri));
  const sendPayload = sendPayloadFactory({ io });
  const onConnection = socketFactory({
    getContext,
    store,
    sendPayload
  });
  const connectorUpdate = connectorUpdateFactory({ store, onConnection, io });
  const userUpdate = userUpdateFactory({ connectorUpdate, sendPayload, store });

  console.log("returning")
  return {
    subscriptions: {
      connectorUpdate,
      userUpdate
    },
    statuses: {
      statusHandler: statusHandlerFactory({ store })
    },
    json: {
      credentialsHandler
    },
  };
};

export default handlers;

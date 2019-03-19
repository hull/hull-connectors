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
  const { server, Client, connectorConfig } = connector;
  const { hostSecret } = connectorConfig;
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
  const userUpdate = userUpdateFactory({ sendPayload, store });
  const connectorUpdate = connectorUpdateFactory({ store, onConnection, io });

  return {
    statuses: [
      {
        url: "/status",
        handler: {
          callback: statusHandlerFactory({ store })
        }
      }
    ],
    html: [
      {
        url: "/admin.html",
        handler: {
          callback: adminHandler
        }
      }
    ],
    notifications: [
      {
        url: "/smart-notifier",
        handlers: {
          "ship:update": {
            callback: connectorUpdate,
            options: {}
          },
          "users_segment:update": {
            callback: connectorUpdate,
            options: {}
          },
          "user:update": {
            options: {
              hostSecret,
              groupTraits: true
            },
            callback: async (ctx, messages) => {
              connectorUpdate(ctx);
              messages.map(message => userUpdate(ctx, message));
              // Get 100 users every 100ms at most.
              return {
                flow_control: {
                  type: "next",
                  in_time: 1,
                  size: 100,
                  in: 100
                }
              };
            }
          }
        }
      }
    ]
  };
};

export default handlers;

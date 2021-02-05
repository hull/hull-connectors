// @flow
import type {
  Connector,
  HullFirehoseKafkaTransport,
  HullHandlersConfiguration
} from "hull";

// import Redis from "redis";
// import redisAdapter from "socket.io-redis";
// import Store from "../lib/store";
// import connectorUpdateFactory from "./connector-update";
import credentialsHandler from "./credentials-handler";
// import legacyV1ApiCompatibility from "./legacy-v1-api-compatibility";
// import onConnectionFactory from "../lib/on-connection";
// import sendPayloadFactory from "../lib/send-payload";
// import statusHandlerFactory from "./status";
// import userUpdateFactory from "./user-update";

// const debug = require("debug")("hull-website");
// const SocketIO = require("socket.io");

const handlers = ({
  // redisUri,
  // firehoseTransport,
  // HULL_DOMAIN,
  REMOTE_DOMAIN
}: {
  redisUri: string,
  firehoseTransport: HullFirehoseKafkaTransport
}) => async (connector: Connector): HullHandlersConfiguration => {
  const { app /* , server, getContext */ } = connector;
  app.get("/socket.io/", (req, res) => {
    const {
      cookies,
      hostname,
      ip,
      params,
      path,
      route,
      query,
      method,
      headers,
      url,
      originalUrl,
      baseUrl,
      body,
      xhr
    } = req;
    const response = {
      cookies,
      hostname,
      ip,
      params,
      path,
      route,
      query,
      method,
      headers,
      url,
      originalUrl,
      baseUrl,
      body,
      xhr
    };
    console.log(response);
    res.send(response);
  });
  // const redis = Redis.createClient(redisUri);
  // const pubClient = redis.duplicate();
  // const subClient = pubClient.duplicate();

  // const store = Store(redis);

  // const io = SocketIO({
  //   transports: ["polling", "websocket"],
  //   pingInterval: 5000,
  //   pingTimeout: 3000
  // }).adapter(redisAdapter({ pubClient, subClient }));

  // io.attach(server);

  // io.of(/^\w+$/).on("connection", socket => {
  //   const { nsp } = socket;
  //   debug("Connection to unknown Namespace", nsp);
  //   nsp.emit("connection.error", { error: "Invalid Namespace " });
  // });

  // // io.on("connection", socket => {
  // //   console.log("On Connection", socket.handshake.query); // prints { x: "42", EIO: "4", transport: "polling" }
  // // });

  // const sendPayload = sendPayloadFactory({ io });
  // const onConnection = onConnectionFactory({
  //   getContext,
  //   store,
  //   sendPayload
  // });
  // const connectorUpdate = connectorUpdateFactory({ store, onConnection, io });
  // const userUpdate = userUpdateFactory({ connectorUpdate, sendPayload, store });

  // app.use(
  //   "/api/v1",
  //   legacyV1ApiCompatibility(firehoseTransport, HULL_DOMAIN, REMOTE_DOMAIN)
  // );

  return {
    statuses: {
      statusHandler: () => {}
    },
    subscriptions: {
      connectorUpdate: () => {},
      userUpdate: () => {}
    },
    json: {
      credentialsHandler: credentialsHandler(REMOTE_DOMAIN)
    }
  };
};

export default handlers;

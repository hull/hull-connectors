import { EventEmitter2 as EventEmitter } from "eventemitter2";
import _get from "lodash/get";
import io from "socket.io-client";
import isEmpty from "lodash/isEmpty";
import { getLocalStorage, setLocalStorage } from "./lib/localstorage";

import diff from "./lib/diff";
import userUpdate from "./lib/user-update";
import getEndpoint from "./lib/get-endpoint";
import findUserIds from "./lib/find-user-ids";

const debug = require("debug")("hull-browser");

// import destinations from "./destinations";

const onEmbed = async (rootNode, deployment, hull) => {
  const { uri } = getEndpoint({ hull, deployment });
  debug("Creating socket on", uri);
  const socket = io(uri, { transports: ["websocket"] });

  const emitter =
    hull ||
    new EventEmitter({
      wildcard: true,
      verboseMemoryLeak: true
    });

  // destinations({ emitter });
  if (!hull) window.hullBrowser = emitter;

  socket.on("connect", () => debug("Connected", { socket }));
  socket.on("disconnect", () => debug("Disconnected", { socket }));
  socket.on("room.joined", res => debug("room.joined", res));
  socket.on("room.error", res => debug("error", res));
  socket.on("cache.miss", res => debug("cache.miss", res));
  socket.on("close", res => debug("close", res));
  socket.on("error", reason => debug("error", reason));
  socket.on("user.update", async (payload = {}) => {
    debug("user.update: received", payload);
    const userId = _get(payload, "user.id");
    const previous = getLocalStorage() || {};
    const changes = diff(payload, previous);
    if (!isEmpty(changes)) {
      debug("user.update: user changed", { changes });
      if (userId) setLocalStorage(payload);
      userUpdate({ emitter, debug, payload, changes });
    } else {
      debug("user.update: no change", { changes });
    }
  });

  findUserIds({
    socket,
    callback: (err, claims) => {
      debug("user.fetch: Asking server for User", { claims });
      socket.emit("user.fetch", { claims });
    }
  });

  // Emit a first event on boot.
  userUpdate({ emitter, debug, payload: getLocalStorage(), boot: true });

  return true;
};

if (window.Hull && window.Hull.onEmbed) {
  window.Hull.onEmbed(onEmbed);
} else {
  onEmbed();
}

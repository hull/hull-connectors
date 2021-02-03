import { EventEmitter2 as EventEmitter } from "eventemitter2";
import { Promise } from "es6-promise";
import _get from "lodash/get";
import find from "lodash/find";
import io from "socket.io-client";
import isEmpty from "lodash/isEmpty";
import {
  getLocalStorage,
  getLocalStorageId,
  setLocalStorage
} from "./lib/localstorage";

import diff from "./lib/diff";
import getAnalyticsIds from "./lib/analytics";
import getHullIds from "./lib/hull";
import getIntercomIds from "./lib/intercom";
import getQueryStringIds from "./lib/querystring";
import userUpdate from "./lib/user-update";

const debug = require("debug")("hull-browser");

// import destinations from "./destinations";

const findId = (ids = []) => find(ids, idGroup => !isEmpty(idGroup));
const getEndpoint = ({ hull, deployment }) => {
  const scriptTag = document.querySelector("script[data-hull-endpoint]");
  let connectorId;
  let endpoint;
  if (hull && deployment) {
    const { ship: connector, platform } = deployment;
    if (platform) {
      connectorId = connector.id;
      endpoint = connector.source_url.replace(/\/$/, "");
    } else if (connector && connector.index) {
      const shipSource = document.createElement("a");
      shipSource.href = deployment.ship.index;
      if (shipSource.hash.match(/^#[a-z0-9]{24}$/)) {
        connectorId = shipSource.hash.substr(1);
        endpoint = shipSource.origin;
      }
    }
  } else if (scriptTag) {
    connectorId = scriptTag.getAttribute("data-hull-id");
    endpoint = scriptTag.getAttribute("data-hull-endpoint");
  }
  if (!connectorId || !endpoint) {
    return console.log(
      "Could not find ID or Endpoint on the Script tag. Did you copy/paste it correctly?"
    );
  }
  return { uri: `${endpoint}/${connectorId}`, connectorId };
};

const findUserIds = async ({ socket, callback }) => {
  try {
    const ids = await Promise.all([
      getLocalStorageId(),
      getQueryStringIds(),
      getIntercomIds(),
      getHullIds(),
      getAnalyticsIds()
    ]);
    const claims = findId(ids);
    if (!isEmpty(claims)) {
      callback(null, claims);
      return;
    }
    setTimeout(() => findUserIds({ socket, callback }), 500);
  } catch (err) {
    debug(err);
  }
};

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

import { Promise } from "es6-promise";
import find from "lodash/find";
import isEmpty from "lodash/isEmpty";
import _get from "lodash/get";
import io from "socket.io-client";
import { EventEmitter2 as EventEmitter } from "eventemitter2";
import debugFactory from "debug";
import {
  setLocalStorage,
  getLocalStorageId,
  getLocalStorage
  // deleteLocalStorage
} from "./lib/localstorage";
import getQueryStringIds from "./lib/querystring";
import getAnalyticsIds from "./lib/analytics";
import getHullIds from "./lib/hull";
import getIntercomIds from "./lib/intercom";
import userUpdate from "./lib/user-update";
import diff from "./lib/diff";
// import destinations from "./destinations";

const onEmbed = (rootNode, deployment, hull) => {
  const debug = debugFactory("hull-browser");
  const scriptTag = document.querySelector("script[data-hull-endpoint]");
  let connectorId;
  let endpoint;
  if (hull && deployment) {
    const { ship: connector, platform } = deployment;
    if (platform) {
      connectorId = connector.id;
      endpoint = `${connector.source_url.replace(/\/$/, "")}`;
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

  const findId = (ids = []) => find(ids, idGroup => !isEmpty(idGroup));
  debug("Creating socket on", `${endpoint}/${connectorId}`);
  const socket = io(`${endpoint}/${connectorId}`, {
    transports: ["websocket"]
  });
  const emitter =
    window.Hull && window.Hull.emit
      ? window.Hull
      : new EventEmitter({
          wildcard: true,
          verboseMemoryLeak: true
        });

  // destinations({ emitter });
  if (!window.Hull) window.hullBrowser = emitter;

  function setup() {
    const search = hull
      ? Promise.all([getHullIds()])
      : Promise.all([
          getLocalStorageId(),
          getQueryStringIds(),
          getIntercomIds(),
          getHullIds(),
          getAnalyticsIds()
        ]);

    search
      .then(
        ids => {
          const found = findId(ids);
          if (!isEmpty(found)) return found;
          setTimeout(setup, 500);
          return null;
        },
        err => debug(err)
      )
      .then(
        (claims = {}) => {
          if (!claims) return null;
          debug("Establishing connection with settings", {
            connectorId,
            claims
          });
          socket.emit("user.fetch", {
            connectorId,
            claims
          });
          return true;
        },
        err => debug(err)
      );
  }

  // Emit a first event on boot.
  getLocalStorage().then(payload =>
    userUpdate({ emitter, debug, payload, boot: true })
  );

  setup();

  socket.on("user.update", async (payload = {}) => {
    debug("user.update start", payload);
    const userId = _get(payload, "user.id");
    const previous = (await getLocalStorage()) || {};
    const changes = diff(payload, previous);
    if (!isEmpty(changes)) {
      debug("user.update CHANGE", changes);
      if (userId) setLocalStorage(payload);
      userUpdate({ emitter, debug, payload, changes });
    }
  });
  socket.on("room.joined", res => {
    debug("room.joined", res);
  });
  socket.on("room.error", res => {
    debug("error", res);
  });
  socket.on("close", ({ message }) => {
    debug("close", message);
  });
  return true;
};

if (window.Hull && window.Hull.onEmbed) {
  window.Hull.onEmbed(onEmbed);
} else {
  onEmbed();
}

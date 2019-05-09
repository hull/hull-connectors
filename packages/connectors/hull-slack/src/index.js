// @flow
/* global window, document, qs, request */

import superagent from "superagent";
import style from "./index.scss";

const reconnectButton = document.getElementById("reconnect_button");
reconnectButton.addEventListener("click", function onClick(e) {
  e.preventDefault();
  e.stopPropagation();
  window.location.href = `/connect?${window.location.href.split("?")[1]}`;
});

window.hullAuthCompleted = function authCompleted() {
  window.location.href = window.location.href.replace("&reset=true", "");
};

style.use();

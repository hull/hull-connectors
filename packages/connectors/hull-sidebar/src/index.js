/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import Engine from "./engine";
import App from "./app";

ready(() => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(<App engine={engine} />, root);
});

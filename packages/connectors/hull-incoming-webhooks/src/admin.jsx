/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import queryParams from "./app/utils";
import Engine from "./app/engine";
import App from "./app";

ready(() => {
  const { ship, organization, secret } = queryParams();
  const root = document.getElementById("app");
  const engine = new Engine({ id: ship, organization, secret });
  engine.setup();
  ReactDOM.render(<App engine={engine} />, root);
});

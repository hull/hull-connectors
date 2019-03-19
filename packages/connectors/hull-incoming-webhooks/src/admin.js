/* eslint-disable react/jsx-filename-extension */
/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import queryParams from "./app/utils";
import App from "./app/main";
import Engine from "./app/engine";
import "./style/index.scss";

ready(() => {
  const { ship, organization, secret } = queryParams();
  const root = document.getElementById("app");
  const engine = new Engine({ ship, organization, secret });
  engine.setup();
  ReactDOM.render(<App engine={engine} />, root);
});

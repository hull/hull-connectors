/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import Engine from "./app/engine";
import App from "./app";

function queryParams(search) {
  return (search || document.location.search)
    .slice(1)
    .split("&")
    .reduce((q, p) => {
      const r = p.split("=");
      q[r[0]] = r[1];
      return q;
    }, {});
}

ready(() => {
  const { ship, organization, secret } = queryParams();
  const root = document.getElementById("app");
  const engine = new Engine({ id: ship, organization, secret });
  engine.setup();
  ReactDOM.render(<App engine={engine} />, root);
});

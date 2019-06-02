/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import Engine from "./app/engine";
import App from "./app";

ready(() => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <App
      engine={engine}
      strings={{
        leftColumnTitle: "Recent Webhooks",
        centerColumnCurrentTab: "Current Code",
        centerColumnPreviousTab: "At Webhook Reception"
      }}
    />,
    root
  );
});

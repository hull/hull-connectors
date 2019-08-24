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
        modalTitle: "Call an external API",
        leftColumnTitle: "Recent",
        centerColumnCurrentTab: "Current Code",
        centerColumnPreviousTab: "At time of call"
      }}
    />,
    root
  );
});

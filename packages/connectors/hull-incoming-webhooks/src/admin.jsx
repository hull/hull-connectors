/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Engine from "./app/engine";
import App from "./app";

const render = Component => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <AppContainer>
      <Component
        engine={engine}
        strings={{
          modalTitle: "Configure your incoming webhook",
          leftColumnTitle: "Recent",
          centerColumnCurrentTab: "Current Code",
          centerColumnPreviousTab: "At Webhook Reception"
        }}
      />
      ,
    </AppContainer>,
    root
  );
};

ready(() => render(App));

if (module.hot) {
  module.hot.accept("./app", () => {
    render(App);
  });
}

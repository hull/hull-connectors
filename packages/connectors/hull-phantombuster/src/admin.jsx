import ready from "domready";
import { hot } from "react-hot-loader/root";
import React from "react";
import ReactDOM from "react-dom";
import Engine from "./app/engine";
import App from "./app";

const render = Component => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <Component
      engine={engine}
      strings={{
        modalTitle: "Parse Phantombuster Results",
        leftColumnTitle: "Recent",
        centerColumnCurrentTab: "Current Code",
        centerColumnPreviousTab: "At time of call"
      }}
    />,
    root
  );
};

ready(() => render(hot(App)));

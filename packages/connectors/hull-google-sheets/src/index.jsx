// @flow

import React from "react";
import ReactDOM from "react-dom";
import ready from "domready";
import { AppContainer } from "react-hot-loader";

import Sidebar from "./sidebar/index";

const render = MainComponent => {
  const root = document.getElementById("sidebar");
  if (!root) {
    return;
  }
  ReactDOM.render(
    <AppContainer warnings={false}>
      <MainComponent />
    </AppContainer>,
    root
  );
};

ready(() => render(Sidebar));

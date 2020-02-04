/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Engine from "./app/engine";
import App from "./app";

const VALID = `Valid identifiers are:
- external_id
- anonymous_id
- domain
- Hull ID`;

const EMPTY = `Please enter the identifier of an Account in the field above.
${VALID}`;

const NOT_FOUND = `We couldn't find a matching Account.
Did you use the right identifiers?

${VALID}`;

const render = Component => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <AppContainer>
      <Component
        engine={engine}
        strings={{
          leftColumnTitle: "Enter Domain or ID to select User or Account",
          leftColumnPreview: EMPTY,
          leftColumnEmpty: NOT_FOUND
        }}
      />
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

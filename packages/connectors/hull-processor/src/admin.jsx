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
- email
- Hull ID`;

const EMPTY = `Please enter the identifier of a User in the field above.
${VALID}`;

const NOT_FOUND = `We couldn't find a matching User.
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
          leftColumnTitle: "Enter Email or ID to preview User",
          leftColumnPreview: EMPTY,
          leftColumnEmpty: NOT_FOUND
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

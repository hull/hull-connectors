/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
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

ready(() => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <App
      engine={engine}
      strings={{
        leftColumnTitle: "Enter Domain or ID to preview Account",
        leftColumnPreview: EMPTY,
        leftColumnEmpty: NOT_FOUND
      }}
    />,
    root
  );
});

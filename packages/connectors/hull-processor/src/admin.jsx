import ready from "domready";
import { hot } from "react-hot-loader/root";
import React from "react";
import ReactDOM from "react-dom";
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
    <Component
      engine={engine}
      strings={{
        leftColumnTitle: "Enter Email or ID to preview User",
        leftColumnPreview: EMPTY,
        leftColumnEmpty: NOT_FOUND
      }}
    />,
    root
  );
};

ready(() => render(hot(App)));

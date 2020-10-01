/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
// import { AppContainer } from "react-hot-loader";
import { hot } from "react-hot-loader/root";
import JsonataUI from "./app";
import Engine from "./engine";

const VALID = `Valid identifiers are:
- external_id
- anonymous_id
- email
- Hull ID`;

const renderApp = ({ empty, notFound, title }) => {
  const engine = new Engine();
  const Component = hot(JsonataUI);
  ReactDOM.render(
    <Component
      engine={engine}
      strings={{
        leftColumnTitle: title,
        leftColumnPreview: empty,
        leftColumnEmpty: notFound
      }}
    />,
    document.getElementById("app")
  );
};

ready(() =>
  renderApp({
    empty: `Please enter the identifier of a User in the field above.
  ${VALID}`,
    notFound: `We couldn't find a matching User.
  Did you use the right identifiers?

  ${VALID}`,
    title: "Enter Email or ID to fetch User"
  })
);

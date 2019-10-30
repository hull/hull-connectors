/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import Engine from "./app/engine";
import App from "./app";

const emptyMessageForEntity = (
  entity = "user"
) => `Please enter the identifier of a User in the field above.

Valid identifiers are:
- external_id
- anonymous_id
- ${entity === "user" ? "email" : "domain"}
- Hull ID
`;
ready(() => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <App
      engine={engine}
      strings={{
        leftColumnTitle: "Enter Email or ID to preview User",
        leftColumnPreview: emptyMessageForEntity("user")
      }}
    />,
    root
  );
});

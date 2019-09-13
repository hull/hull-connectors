/* global document */

import ready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import Engine from "./app/engine";
import App from "./app";

const emptyMessageForEntity = (
  entityType = "user"
) => `Please enter the identifier of an Account in the field above.

Valid identifiers are:
- external_id
- anonymous_id
- ${entityType === "user" ? "email" : "domain"}
- Hull ID
`;
ready(() => {
  const root = document.getElementById("app");
  const engine = new Engine();
  ReactDOM.render(
    <App
      engine={engine}
      strings={{
        leftColumnTitle: "Enter Domain or ID to preview Account",
        leftColumnPreview: emptyMessageForEntity("account")
      }}
    />,
    root
  );
});

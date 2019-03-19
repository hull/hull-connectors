// @flow

import React from "react";
import Badge from "react-bootstrap/Badge";
import type { Entry } from "../../../types";

const LABELS = {
  post: "success",
  get: "info",
  delete: "danger",
  put: "warning"
};

const PayloadTitle = ({
  entry,
  showDate = false
}: {
  entry?: Entry,
  showDate?: boolean
}) =>
  !entry ? (
    "Nothing to show"
  ) : (
    <span>
      <Badge
        size="sm"
        variant={LABELS[entry.payload.method.toLowerCase()]}
        style={{ marginRight: 5 }}
      >
        {entry.payload.method}
      </Badge>
      <span className="entry-content">
        {entry.payload.headers["user-agent"]}
      </span>
      {showDate ? (
        <small style={{ display: "block" }}>{entry.date}</small>
      ) : null}
    </span>
  );

export default PayloadTitle;

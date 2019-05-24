// @flow
import React from "react";

const CodeTitle = ({
  title,
  error
}: {
  title: string | React$Node,
  error?: boolean
}) => (
  <h6
    className={`mt-05 mb-05 content-tag ${error ? "content-tag--error" : ""}`}
  >
    {title}
  </h6>
);

export default CodeTitle;

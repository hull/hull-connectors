// @flow

import SVG from "react-inlinesvg";
import React from "react";

const Errors = ({ errors }: { errors?: Array<string> }) =>
  errors && !!errors.length ? (
    <div className="error">
      <SVG
        className="error-icon service-icon"
        src={require("../icons/error.svg")}
      />
      {errors.map((c, i) => (
        <span key={i}>{c}</span>
      ))}
    </div>
  ) : null;
export default Errors;

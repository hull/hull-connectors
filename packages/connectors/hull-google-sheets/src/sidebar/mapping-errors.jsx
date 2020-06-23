// @flow

import SVG from "react-inlinesvg";
import React from "react";

const Errors = ({ errors }: { errors?: Array<string> }) =>
  errors &&
  !!errors.length && (
    <div className="error">
      <SVG
        className="error-icon service-icon"
        src={require("../icons/error.svg")}
      />
      Invalid Characters, please fix:
      <ul>
        {errors.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
export default Errors;

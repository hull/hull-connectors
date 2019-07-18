// @flow
import React from "react";

const Spinner = ({ className }: { className: string }) => (
  <div className={`lds-ring ${className}`}>
    <div />
    <div />
    <div />
    <div />
  </div>
);

export default Spinner;

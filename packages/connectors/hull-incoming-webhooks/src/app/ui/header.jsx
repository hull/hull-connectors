// @flow
import React from "react";

const Header = ({ title, children }: { title?: any, children: React$Node }) => (
  <div className="flexRow header">
    {title && <h6 className="mb-0 mt-025 text-muted flexGrow">{title}</h6>}
    {children}
  </div>
);

export default Header;

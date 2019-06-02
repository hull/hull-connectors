// @flow
import React from "react";

const Header = ({ title, children }: { title?: any, children: React$Node }) => (
  <div className="row no-gutters header align-center pl-3 pr-3 pt-0 pb-0">
    {title && <h6 className="mb-0 mt-025 flex-grow">{title}</h6>}
    {children}
  </div>
);

export default Header;

// @flow
import React from "react";

const Header = ({ title, children }: { title?: any, children: React$Node }) => (
  <div className="row no-gutters header align-center pl-2 pr-2 pt-0 pb-0">
    {title && <h6 className="mb-0 mt-025 flex-grow text-right">{title}</h6>}
    {children}
  </div>
);

export default Header;

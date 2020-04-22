// @flow

import React, { PureComponent } from "react";
import Creatable from "react-select/creatable";

type MappingProp = {
  google: string,
  hull: string,
  idx: number,
  options: any,
  enabled?: boolean,
  onChange: (number, any) => void
};

export default class MappingLine extends PureComponent<MappingProp> {
  handleUpdateField = (e: any) => this.props.onChange(this.props.idx, e);

  render() {
    const { google, hull, idx, options } = this.props;
    return (
      <div style={{ paddingBottom: 10 }}>
        <label
          htmlFor={`enabled_${idx}`}
          className={hull ? "" : "gray"}
          style={{ display: "block" }}
        >
          {google}
        </label>
        <Creatable
          isClearable
          allowCreateWhileLoading
          value={{ value: hull }}
          options={options}
          onChange={this.handleUpdateField}
        />
      </div>
    );
  }
}

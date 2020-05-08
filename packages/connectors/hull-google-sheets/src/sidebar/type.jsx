// @flow

import React, { Fragment, Component } from "react";
import type { ImportType } from "../../types";

type Props = {
  type?: ImportType,
  onChange: any => void
};

type State = {};

class Type extends Component<Props, State> {
  handleChangeEntityType = (e: any) => this.props.onChange(e.target.value);

  render() {
    const { type } = this.props;
    return (
      <div className="flex-row">
        <h4>Import Type : </h4>
        <select
          style={{ width: "100%" }}
          value={type}
          onChange={this.handleChangeEntityType}
        >
          <option value="user" default>
            Users
          </option>
          <option value="account">Accounts</option>
        </select>
      </div>
    );
  }
}

export default Type;

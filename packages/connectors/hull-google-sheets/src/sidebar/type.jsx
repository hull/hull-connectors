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
      <table className="full-width">
        <tbody>
          <tr>
            <td className="no-style row-name">
              <h4>Import Type : </h4>
            </td>
            <td className="no-style row-value">
              <select value={type} onChange={this.handleChangeEntityType}>
                <option value="user" default>
                  Users
                </option>
                <option value="account">Accounts</option>
                <option value="user_event">User Events</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}

export default Type;

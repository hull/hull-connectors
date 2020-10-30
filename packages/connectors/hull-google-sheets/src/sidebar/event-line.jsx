// @flow

import React, { Component } from "react";
// import Select from "react-select";
import type { GoogleColumns } from "../../types";

type Props = {
  googleColumns?: GoogleColumns,
  setting: string,
  description: string,
  name: string,
  value?: string,
  onUpdate: ({
    [string]: string
  }) => void
};
type State = {};

class EventLine extends Component<Props, State> {
  handleUpdateSetting = (event: SyntheticEvent<>) => {
    // $FlowFixMe
    const { value } = event.currentTarget;
    const { setting } = this.props;
    this.props.onUpdate({ [setting]: value === "" ? undefined : value });
  };

  render() {
    const { name, description, googleColumns = [], value } = this.props;
    return (
      <tr className="no-style claim-line">
        <td className="no-style row-name">{name} :</td>
        <td className="no-style row-value">
          <select onChange={this.handleUpdateSetting} value={value}>
            <option value="">---[Not Mapped]---</option>
            {googleColumns.map((option, i) => (
              <option key={i} value={i}>
                {option}
              </option>
            ))}
          </select>
          <small>{description}</small>
        </td>
      </tr>
    );
  }
}

export default EventLine;

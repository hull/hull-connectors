// @flow

import React, { Component } from "react";
// import Select from "react-select";
import type { GoogleColumns } from "../../types";

type Props = {
  googleColumns?: GoogleColumns,
  claim: string,
  value?: string,
  onUpdate: ({
    claim: string,
    value: number
  }) => void
};
type State = {};

class ClaimLine extends Component<Props, State> {
  handleUpdateClaim = (event: SyntheticEvent<>) => {
    // $FlowFixMe
    const { value } = event.currentTarget;
    const { claim } = this.props;
    this.props.onUpdate({ [claim]: value === "" ? undefined : value });
  };

  render() {
    const { claim, googleColumns = [], value } = this.props;
    return (
      <tr className="no-style claim-line">
        <td className="no-style row-name">{claim} :</td>
        <td className="no-style row-value">
          <select onChange={this.handleUpdateClaim} value={value}>
            <option value="">---[Not Mapped]---</option>
            {googleColumns.map((option, i) => (
              <option key={i} value={i}>
                {option}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
  }
}

export default ClaimLine;

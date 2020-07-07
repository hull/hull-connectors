// @flow

import React, { Component } from "react";

type Props = {
  initialized: boolean,
  onSave: ({}) => Promise<any>,
  onReset: ({}) => Promise<any>,
  onChangeToken: string => void,
  token?: string
};
type State = {};

class Settings extends Component<Props, State> {
  handleChangeToken = (e: any) => {
    const value = e.currentTarget.value;
    this.props.onChangeToken(value ? value.trim() : value);
  };

  renderConfig() {
    const { token } = this.props;
    // const config = this.getConfigFromToken();
    // if (!config || !config.id) {
    //   return undefined;
    // }
    return (
      <div>
        <div className="form-group block">
          <label>
            <b>Secure Token</b>
          </label>
          <p>{token}</p>
        </div>
      </div>
    );
  }

  render() {
    const { initialized, token = "", onSave, onReset } = this.props;
    return (
      <div>
        {!initialized && (
          <p>
            Start by adding the Token you copied from the Hull Connector
            Settings section
          </p>
        )}
        <p>
          <b>You can find the Hull token in the Connector settings page</b>
        </p>
        <div className="form-group block">
          <label htmlFor="token">Hull Token</label>
          <input
            style={{ width: "100%" }}
            type="text"
            id="token"
            value={token}
            onChange={this.handleChangeToken}
          />
        </div>
        <div className="block">
          <button className="button blue" disabled={!token} onClick={onSave}>
            Save
          </button>
          <button className="button red right" onClick={onReset}>
            Reset All
          </button>
        </div>
      </div>
    );
  }
}

export default Settings;

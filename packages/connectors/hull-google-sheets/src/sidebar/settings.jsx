// @flow

import React, { Component } from "react";
import type { SettingsType } from "../../types";

type Props = {
  onSave: ({}) => void,
  onChangeToken: string => void,
  settings?: SettingsType
};
type State = {};

class Settings extends Component<Props, State> {
  handleChangeToken = (e: any) => {
    this.props.onChangeToken(
      e.target.value ? e.target.value.trim() : e.target.value
    );
  };

  renderConfig() {
    const { settings = {} } = this.props;
    const { hullToken } = settings;
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
          <p>{hullToken}</p>
        </div>
      </div>
    );
  }

  render() {
    const { settings = {}, onSave } = this.props;
    const { hullToken } = settings;
    return (
      <div>
        <p>
          <b>You can find the Hull token in the Connector settings page</b>
        </p>
        <div className="form-group block">
          <label htmlFor="token">Hull Token</label>
          <input
            style={{ width: "100%" }}
            type="text"
            id="token"
            value={hullToken}
            onChange={this.handleChangeToken}
          />
        </div>
        <div className="block">
          <button className="blue" disabled={!hullToken} onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    );
  }
}

export default Settings;

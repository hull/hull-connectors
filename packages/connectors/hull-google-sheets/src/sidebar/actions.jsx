// @flow

import React, { PureComponent } from "react";
import SVG from "react-inlinesvg";
import type { ImportType } from "../../types";

type Props = {
  type?: ImportType,
  valid: boolean,
  loading: boolean,
  saving: boolean,
  initialized: boolean,
  displaySettings?: boolean,
  onToggleSettings: () => any,
  onStartImport: () => Promise<void>,
  onReloadColumns: any => any
};

class Actions extends PureComponent<Props, {}> {
  render() {
    const {
      saving,
      loading,
      valid,
      displaySettings,
      onStartImport,
      initialized
    } = this.props;
    return (
      <div className="form-group">
        <button
          disabled={displaySettings || loading || saving}
          onClick={this.props.onToggleSettings}
        >
          Edit Settings
        </button>
        {!displaySettings && (
          <button
            disabled={loading || saving}
            onClick={this.props.onReloadColumns}
          >
            Reload
          </button>
        )}
        {initialized && !displaySettings && (
          <button
            className="button blue right import"
            disabled={!valid || loading || saving}
            onClick={onStartImport}
          >
            <SVG className="icon small" src={require("../icons/import.svg")} />
            Import
          </button>
        )}
      </div>
    );
  }
}

export default Actions;

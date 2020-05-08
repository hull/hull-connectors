// @flow

import React, { PureComponent } from "react";
import type { ImportType } from "../../types";
import Import from "../icons/import";

type Props = {
  type?: ImportType,
  valid: boolean,
  loading: boolean,
  saving: boolean,
  initialized: boolean,
  showSettings?: boolean,
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
      showSettings,
      onStartImport,
      initialized
    } = this.props;
    return (
      <div className="form-group">
        <button
          disabled={loading || saving}
          onClick={this.props.onReloadColumns}
        >
          Reload
        </button>
        <button
          disabled={loading || saving}
          onClick={this.props.onToggleSettings}
        >
          Edit token
        </button>
        {initialized && !showSettings && (
          <button
            className="blue right"
            disabled={!valid || loading || saving}
            onClick={onStartImport}
          >
            <Import />
            Start Import
          </button>
        )}
      </div>
    );
  }
}

export default Actions;

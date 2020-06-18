// @flow

import React, { Fragment, PureComponent } from "react";
import SVG from "react-inlinesvg";
import type { ImportType } from "../../types";

type Props = {
  type?: ImportType,
  valid: boolean,
  loading: boolean,
  saving: boolean,
  range: any,
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
      range,
      displaySettings,
      onStartImport,
      initialized
    } = this.props;
    const { firstRow, lastRow } = range;
    return (
      <Fragment>
        <div className="form-group">
          <button
            disabled={loading || saving}
            onClick={this.props.onToggleSettings}
          >
            {displaySettings ? "Cancel" : "Edit Settings"}
          </button>
          {!displaySettings && (
            <button
              disabled={loading || saving}
              onClick={this.props.onReloadColumns}
            >
              Reload
            </button>
          )}
        </div>
        <div className="form-group">
          {initialized && !displaySettings && (
            <button
              className="button blue import"
              disabled={!valid || loading || saving}
              onClick={onStartImport}
            >
              <SVG
                className="icon small"
                src={require("../icons/import.svg")}
              />
              Import {firstRow === lastRow ? `row ${firstRow}` : `rows ${firstRow}-${lastRow}`}
            </button>
          )}
        </div>
      </Fragment>
    );
  }
}

export default Actions;

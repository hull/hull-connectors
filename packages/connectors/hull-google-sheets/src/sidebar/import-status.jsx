// @flow

import React, { Component } from "react";

import type { ImportProgressType } from "../../types";

type Props = {
  importStatus?: string,
  importProgress?: ImportProgressType,
  clearImportStatus: () => void
};
type State = {};

export default class ImportStatus extends Component<Props, State> {
  render() {
    const { importStatus, importProgress = {}, clearImportStatus } = this.props;
    const { imported } = importProgress;
    return (
      <div>
        {importStatus && (
          <p>
            <b>Importing your sheet - {importStatus}</b>
          </p>
        )}
        <p>{imported || 0} imported</p>

        {importStatus === "done" ? (
          <button onClick={clearImportStatus}>Start another import</button>
        ) : null}
      </div>
    );
  }
}

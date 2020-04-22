// @flow

import React, { Component } from "react";

import type { ImportStatusType, ImportProgressType } from "../../types";

type Props = {
  importStatus?: ImportStatusType,
  importProgress?: ImportProgressType,
  clearImportStatus: () => void
};
type State = {};

export default class ImportStatus extends Component<Props, State> {
  render() {
    const {
      importStatus = {},
      importProgress = {},
      clearImportStatus
    } = this.props;
    const { imported } = importProgress;
    const { status, result } = importStatus;
    return (
      <div>
        <p>
          <b>Importing your sheet - {status}</b>
        </p>

        <p>{(result ? result.imported : imported) || 0} imported</p>

        {status === "done" ? (
          <button onClick={clearImportStatus}>Start another import</button>
        ) : null}
      </div>
    );
  }
}

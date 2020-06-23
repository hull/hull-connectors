// @flow

import React, { Component } from "react";

import type { ImportProgressType } from "../../types";

type Props = {
  importStatus?: string,
  importProgress?: ImportProgressType
};
type State = {};

export default class ImportStatus extends Component<Props, State> {
  render() {
    const { importStatus, importProgress = {} } = this.props;
    const { imported } = importProgress;
    return importStatus ? (
      <p>
        {importStatus} - {imported ? `${imported} imported` : ""}{" "}
      </p>
    ) : null;
  }
}

// @flow

import React, { Component } from "react";
import _ from "lodash";
import Settings from "./settings";
import Mapping from "./mapping";
import ImportStatus from "./import-status";
import Service from "./service";
import type {
  ImportType,
  GoogleColumns,
  HullAttributes,
  SettingsType,
  GetActiveSheetResponse,
  AttributeMapping,
  UserPropsType,
  ImportProgressType,
  ImportStatusType
} from "../../types";

type Props = {};

type State = {
  activeSheetIndex: number,

  importStatus?: ImportStatusType,
  importProgress?: ImportProgressType,

  loading: boolean | string,
  displaySettings: boolean,

  settings: SettingsType,

  type: ImportType,
  source?: string,

  mapping: AttributeMapping,
  claims: AttributeMapping,

  googleColumns: GoogleColumns,
  hullAttributes: HullAttributes
};

export default class Sidebar extends Component<Props, State> {
  autoSaveUserProps: () => Promise<void>;

  activeSheetTimer: IntervalID;

  constructor(props: Props) {
    super(props);
    this.autoSaveUserProps = _.debounce(this.saveUserProps, 1000);
  }

  componentDidMount() {
    this.setState({
      loading: false,
      displaySettings: false,
      settings: undefined,

      mapping: [],
      claims: [],

      googleColumns: [],
      hullAttributes: []
    });
    this.bootstrap();
  }

  componentWillUnmount() {
    this.stopPollingActiveSheet();
  }

  startPollingActiveSheet() {
    this.activeSheetTimer = setInterval(this.getActiveSheet, 1000);
  }

  stopPollingActiveSheet() {
    if (this.activeSheetTimer) {
      clearInterval(this.activeSheetTimer);
    }
  }

  bootstrap = async () => {
    const { loading } = this.state;
    if (loading) return false;
    this.setState({ loading: true });
    this.stopPollingActiveSheet();
    const state = await Service.bootstrap();
    this.setState({ ...state, loading: false });
    this.startPollingActiveSheet();
    return true;
  };

  saveUserProps = async () => {
    const userProps = _.pick(
      this.state,
      "mapping",
      "claims",
      "settings",
      "type",
      "source"
    );
    this.setState({ loading: "saving..." });
    await this.handleSaveUserProps(userProps);
    this.setState({ loading: false });
  };

  getActiveSheet = async () => {
    const {
      activeSheetIndex,
      importProgress: stateImportProgress
    } = this.state;
    const {
      index,
      importProgress
    }: GetActiveSheetResponse = await Service.getActiveSheet();
    if (!_.isEqual(stateImportProgress, importProgress)) {
      this.setState({ importProgress, activeSheetIndex: index });
    }
    if (activeSheetIndex !== index) {
      this.bootstrap();
    }
  };

  toggleSettings = () =>
    this.setState({
      displaySettings: !this.state.displaySettings
    });

  handleSaveUserProps = async ({
    mapping,
    settings,
    type,
    claims,
    source
  }: UserPropsType) => {
    const { activeSheetIndex } = this.state;

    await Promise.all([
      Service.setUserProp("settings", settings),
      Service.setUserProp(`mapping-${activeSheetIndex}`, mapping),
      Service.setUserProp(`claims-${activeSheetIndex}`, claims),
      Service.setUserProp(`type-${activeSheetIndex}`, type),
      Service.setUserProp(`source-${activeSheetIndex}`, source)
    ]);
  };

  handleReloadColumns = () => this.bootstrap();

  handleSaveSettings = async () => {
    await this.saveUserProps();
    this.toggleSettings();
  };

  handleChangeToken = (hullToken: string) =>
    this.setState({
      settings: { ...this.state.settings, hullToken }
    });

  handleChange = ({
    target,
    value,
    index
  }: {
    target: "mapping" | "claims",
    value: string,
    index: number
  }) => {
    const mapping = [...this.state[target]];
    mapping[index] = {
      hull: value,
      service: this.state.googleColumns[index]
    };
    this.setState({ [target]: mapping });
    this.autoSaveUserProps();
  };

  handleChangeEntityType = (type: ImportType) => {
    this.setState({ type });
    this.autoSaveUserProps();
  };

  handleClearImportStatus = () => this.setState({ importStatus: undefined });

  handleStartImport = async () => {
    this.setState({
      loading: "Importing...",
      importStatus: { status: "working" }
    });
    try {
      const result = await Service.importData();
      this.setState({
        importStatus: { status: "done", result },
        loading: false
      });
    } catch (err) {
      this.setState({
        importStatus: { status: "error", message: _.get(err, "message") },
        loading: false
      });
    }
  };

  renderMain() {
    const {
      importStatus,
      settings,
      loading,
      mapping,
      claims,
      source
    } = this.state;

    if (!settings || loading || !mapping || !claims) {
      return <div>Loading !...</div>;
    }

    const { hullAttributes, googleColumns, importProgress } = this.state;
    if (!settings || !settings.hullToken) {
      return (
        <Settings
          settings={settings}
          onChangeToken={this.handleChangeToken}
          onSave={this.handleSaveSettings}
        />
      );
    }
    if (importStatus) {
      return (
        <ImportStatus
          importStatus={importStatus}
          importProgress={importProgress}
          clearImportStatus={this.handleClearImportStatus}
        />
      );
    }
    return (
      <Mapping
        mapping={mapping}
        claims={claims}
        source={source}
        hullAttributes={hullAttributes}
        googleColumns={googleColumns}
        importStatus={importStatus}
        onChange={this.handleChange}
        onChangeEntityType={this.handleChangeEntityType}
        onStartImport={this.handleStartImport}
      />
    );
  }

  render() {
    const { loading, displaySettings } = this.state;
    return (
      <div>
        <div className="sidebar">
          <div>
            <span style={{ float: "right" }}>{loading}</span>
            <button onClick={this.toggleSettings}>
              {displaySettings ? "Hide" : "Show"} token
            </button>
            <button onClick={this.handleReloadColumns}>Reload columns</button>
          </div>
          {this.renderMain()}
        </div>
      </div>
    );
  }
}

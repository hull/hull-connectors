// @flow

import React, { Component } from "react";
import _ from "lodash";
import Settings from "./settings";
import Spinner from "./spinner";
import Mapping from "./mapping";
import Claims from "./claims";
import ImportStatus from "./import-status";
import Service from "./service";
import Type from "./type";
import Source from "./source";
import Actions from "./actions";

import type {
  ImportType,
  GoogleColumns,
  HullAttributes,
  UserClaims,
  AccountClaims,
  GetActiveSheetResponse,
  AttributeMapping,
  MappingType,
  ImportProgressType,
  ImportStatusType,
  ClaimsType
} from "../../types";

type Props = {};

type State = {
  activeSheetIndex?: number,

  importStatus?: ImportStatusType,
  importProgress?: ImportProgressType,

  name?: string,

  loading: boolean,
  initialized: boolean,
  saving: boolean,
  importing: boolean,
  displaySettings: boolean,

  token?: string,

  type: ImportType,
  source?: string,
  error?: string,

  mapping: AttributeMapping,
  claims: UserClaims | AccountClaims,

  googleColumns: GoogleColumns,
  hullAttributes: HullAttributes
};

const shouldDisplaySettings = ({ token, initialized }: State) =>
  initialized && !token;

export default class Sidebar extends Component<Props, State> {
  autoSaveUserProps: any => Promise<void>;

  activeSheetTimer: IntervalID;

  constructor(props: Props) {
    super(props);
    this.autoSaveUserProps = _.debounce(this.saveUserProps, 1000);
    this.state = {
      type: "user",
      activeSheetIndex: undefined,
      token: undefined,
      initialized: false,
      loading: false,
      saving: false,
      importing: false,
      displaySettings: false,
      error: undefined,

      mapping: [],
      claims: {},

      googleColumns: [],
      hullAttributes: []
    };
  }

  componentDidMount() {
    this.startPollingActiveSheet();
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

  getActiveSheet = async () => {
    const { loading } = this.state;
    if (loading) {
      return;
    }
    const response: GetActiveSheetResponse = await Service.getActiveSheet();
    const { activeSheetIndex } = response;
    if (activeSheetIndex !== this.state.activeSheetIndex) {
      this.fetchSettings(activeSheetIndex);
    }
    this.setState(response);
  };

  fetchSettings = async (activeSheetIndex?: number) => {
    const { loading } = this.state;
    if (loading || activeSheetIndex === undefined) return false;
    this.setState({ activeSheetIndex, loading: true, error: undefined });
    try {
      const state = await Service.bootstrap(activeSheetIndex);
      console.log("BOOTSTRAPPED", state);
      const { token, hullAttributes, googleColumns, displaySettings } = state;
      this.setState({
        ...state,
        ...this.state,
        googleColumns,
        hullAttributes,
        token,
        displaySettings: token ? displaySettings : true,
        loading: false,
        error: undefined,
        initialized: true
      });
    } catch (err) {
      this.setState({ error: err.message });
      console.log(err);
    }
    return true;
  };

  saveUserProps = async (data: {}, options?: { reload: true }) => {
    this.setState({ saving: true });
    const { activeSheetIndex } = this.state;
    if (!activeSheetIndex) {
      return;
    }
    const newState = {
      index: activeSheetIndex,
      data
    };
    console.log("SAVING USER PROPS", newState);
    const state = await Service.setUserProps(newState);
    console.log("SAVED AND RECEIVED", state);
    if (options && options.reload) {
      this.setState(state);
    } else {
      this.setState(_.pick(state, ["googleColumns", "hullAttributes"]));
    }
    this.setState({ loading: false, saving: false });
  };

  toggleSettings = () =>
    this.setState({
      displaySettings: !this.state.displaySettings
    });

  updateState = (newState: {}, options?: { reload: boolean }) =>
    this.setState(newState, () => this.saveUserProps(newState, options));

  handleReloadColumns = () => this.fetchSettings(this.state.activeSheetIndex);

  handleSaveSettings = async () => {
    await Service.setUserProp({
      key: "token",
      value: this.state.token
    });
    this.toggleSettings();
  };

  handleChangeToken = (token: string) => this.setState({ token });

  handleChangeSource = async (source: string) => this.updateState({ source });

  handleAddMapping = () => {
    const { type } = this.state;
    const key = `${type}_mapping`;
    const mapping = [
      ...(this.state[key] || []),
      {
        hull: this.state.hullAttributes[0],
        service: this.state.googleColumns[0]
      }
    ];
    this.updateState({ [key]: mapping });
  };

  handleRemoveMapping = ({ index }: { index: number }) => {
    const { type } = this.state;
    const key = `${type}_mapping`;
    const mapping = [...(this.state[key] || [])];
    mapping.splice(index, 1);
    this.updateState({ [key]: mapping });
  };

  handleChangeMapping = ({
    value,
    index
  }: {
    value: MappingType,
    index: number
  }) => {
    const { type } = this.state;
    const key = `${type}_mapping`;
    const mapping = [...(this.state[key] || [])];
    mapping[index] = value;
    this.updateState({ [key]: mapping });
  };

  handleChangeClaim = (newClaims: ClaimsType) => {
    const { type } = this.state;
    const key = `${type}_claims`;
    const claims = { ...this.state[key] };
    const mergedClaims = { ...claims, ...newClaims };
    console.log("Merging", { [key]: mergedClaims });
    this.updateState({
      [key]: mergedClaims
    });
  };

  handleChangeType = (type: ImportType) =>
    this.setState({ loading: true }, () =>
      this.updateState({ type }, { reload: true })
    );

  handleClearImportStatus = () => this.setState({ importStatus: undefined });

  handleStartImport = async () => {
    this.setState({
      importing: true,
      importStatus: { status: "working" }
    });
    try {
      const result = await Service.importData();
      this.setState({
        importStatus: { status: "done", result },
        importing: false
      });
    } catch (err) {
      this.setState({
        importStatus: { status: "error", message: _.get(err, "message") },
        importing: false
      });
    }
  };

  renderMain() {
    const {
      importProgress,
      importStatus,
      token,
      source,
      loading,
      initialized,
      type,
      displaySettings,
      importing
    } = this.state;

    const valid = true;

    if (displaySettings || shouldDisplaySettings(this.state)) {
      return (
        <Settings
          token={token}
          onChangeToken={this.handleChangeToken}
          onSave={this.handleSaveSettings}
        />
      );
    }

    if (loading || !initialized) {
      return <Spinner />;
    }

    if (importing) {
      return (
        <ImportStatus
          importStatus={importStatus}
          importProgress={importProgress}
          clearImportStatus={this.handleClearImportStatus}
        />
      );
    }
    return (
      <div style={{ paddingBottom: "5em" }}>
        <Type type={type} onChange={this.handleChangeType} />
        <Source source={source} onChange={this.handleChangeSource} />
        {this.renderClaims()}
        {this.renderMapping()}
      </div>
    );
  }

  renderClaims() {
    const { type, googleColumns } = this.state;
    const claims = this.state[`${type}_claims`] || [];
    return (
      <Claims
        valid={true}
        type={type}
        claims={claims}
        googleColumns={googleColumns}
        onChangeRow={this.handleChangeClaim}
      />
    );
  }

  renderMapping() {
    const { hullAttributes, source, type, googleColumns, loading } = this.state;
    const mapping = this.state[`${type}_mapping`] || [];
    return (
      hullAttributes &&
      googleColumns && (
        <Mapping
          mapping={mapping}
          source={source}
          loading={loading}
          hullAttributes={hullAttributes}
          googleColumns={googleColumns}
          onChangeRow={this.handleChangeMapping}
          onRemoveRow={this.handleRemoveMapping}
          onAddRow={this.handleAddMapping}
        />
      )
    );
  }

  render() {
    const {
      claims,
      initialized,
      loading,
      type,
      saving,
      error,
      name = ""
    } = this.state;
    const valid = true;
    return (
      <div>
        <div className="sidebar">
          <div>
            <p>
              {(saving && " Saving...") || (name && ` Current Sheet: ${name}`)}
            </p>
            <Actions
              saving={saving}
              loading={loading}
              valid={valid}
              claims={claims}
              type={type}
              initialized={initialized}
              onReloadColumns={this.handleReloadColumns}
              onToggleSettings={this.toggleSettings}
              onStartImport={this.handleStartImport}
            />
            <p>{!!error && <span className="error">{error}</span>}</p>
          </div>
          {this.renderMain()}
        </div>
      </div>
    );
  }
}

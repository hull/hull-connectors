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
  index?: number,

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
      index: undefined,
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
    const { index } = response;
    if (index !== this.state.index) {
      this.fetchSettings(index);
    }
    this.setState(response);
  };

  fetchSettings = async (index?: number) => {
    const { loading, displaySettings } = this.state;
    if (loading || index === undefined) return false;
    this.setState({ index, loading: true, error: undefined });
    try {
      const state = await Service.bootstrap(index);
      console.log("BOOTSTRAPPED", state);
      const { token } = state;
      this.setState({
        initialized: true,
        error: undefined,
        loading: false,
        ...state,
        displaySettings: token ? displaySettings : true
      });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
      console.log(err);
    }
    return true;
  };

  saveUserProps = async (data: {}, options?: { reload: boolean }) => {
    this.setState({ saving: true });
    const { index } = this.state;
    if (!index) {
      return;
    }
    const newState = {
      index,
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

  handleReset = async () => {
    this.setState({
      loading: false,
      initialized: false,
      displaySettings: true
    });
    await Service.clearProperties();
    this.fetchSettings(this.state.index);
  };

  toggleSettings = () =>
    this.setState({
      displaySettings: !this.state.displaySettings
    });

  updateState = (newState: {}, options?: { reload: boolean }) =>
    this.setState(newState, () => this.saveUserProps(newState, options));

  handleReloadColumns = () => this.fetchSettings(this.state.index);

  handleSaveSettings = async () => {
    this.setState({
      loading: true,
      initialized: false,
      displaySettings: false
    });
    await Service.setUserProp({
      key: "token",
      value: this.state.token
    });
    this.fetchSettings(this.state.index);
    // this.toggleSettings();
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
        column: 0
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
    this.updateState({ [key]: { ...claims, ...newClaims } });
  };

  handleChangeType = (type: ImportType) =>
    this.setState({ loading: true }, () =>
      this.updateState({ type }, { reload: true })
    );

  handleClearImportStatus = () => this.setState({ importStatus: undefined });

  handleStartImport = async () => {
    this.setState({
      importing: true,
      importStatus: "working"
    });
    const { index, type, source } = this.state;
    const mapping = this.state[`${type}_mapping`];
    const claims = this.state[`${type}_claims`];
    try {
      const result = await Service.importData({
        index,
        type,
        source,
        mapping,
        claims
      });
      this.setState({
        importing: false,
        importStatus: "done"
      });
    } catch (err) {
      this.setState({
        importing: false,
        importStatus: "error",
        importErrors: [_.get(err, "message"), ...this.state.importErrors]
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
          initialized={initialized}
          token={token}
          onReset={this.handleReset}
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
      displaySettings,
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
              displaySettings={displaySettings}
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

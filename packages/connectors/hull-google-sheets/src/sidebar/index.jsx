// @flow

import React, { Fragment, Component } from "react";
import _ from "lodash";
import Settings from "./settings";
import Spinner from "./spinner";
import Mapping from "./mapping";
import Claims from "./claims";
import ImportStatus from "./import-status";
import Service from "./service";
import Source from "./source";
import Type from "./type";
import Actions from "./actions";
import {
  addSource,
  filterMapping,
  filterAttributes,
  isValidMapping,
  validateMapping,
  isValidClaims
} from "../lib/filter-utils";

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

  error?: string,

  type: ImportType,
  source: string,

  user_mapping: AttributeMapping,
  user_claims: UserClaims | AccountClaims,

  account_mapping: AttributeMapping,
  account_claims: UserClaims | AccountClaims,

  googleColumns: GoogleColumns,
  hullAttributes: HullAttributes,
  hullGroups: Array<string>
};

const SAVED_CONFIG = [
  "user_mapping",
  "account_mapping",
  "user_claims",
  "account_claims",
  "type",
  "source"
];

export default class Sidebar extends Component<Props, State> {
  autoSaveConfig: any => Promise<void>;

  activeSheetTimer: IntervalID;

  state = {
    initialized: false,
    loading: false,
    saving: false,
    importing: false,
    displaySettings: false,
    error: undefined,

    name: undefined,

    importStatus: undefined,
    importProgress: undefined,

    index: undefined,
    token: undefined,

    type: "user",
    source: "google_sheets",

    user_mapping: [],
    account_mapping: [],
    user_claims: {},
    account_claims: {},

    googleColumns: [],
    hullAttributes: [],
    hullGroups: []
  };

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
      this.bootstrap(index);
    }
    this.setState(response);
  };

  bootstrap = async (index?: number) => {
    const { loading, displaySettings } = this.state;
    if (loading || index === undefined) return false;
    this.setState({ index, loading: true, error: undefined });
    try {
      const state = await Service.bootstrap(index);
      console.log("BOOTSTRAPPED", state);
      this.setState({
        error: undefined,
        loading: false,
        ...state,
        displaySettings: state.token ? displaySettings : true
      });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
      console.log(err);
    }
    return true;
  };

  // Getters
  getClaimsType = () => `${this.state.type}_claims`;

  getMappingType = () => `${this.state.type}_mapping`;

  getClaims = () => this.state[this.getClaimsType()] || [];

  getMapping = () => this.state[this.getMappingType()] || [];

  isValid = () =>
    isValidClaims(this.getClaims()) && isValidMapping(this.getMapping());

  getError = () => {
    const { type, initialized, error } = this.state;
    if (!initialized) return undefined;
    if (!isValidClaims(this.getClaims())) {
      return `You need to configure at least one claim to resolve ${type} identities`;
    }
    if (!isValidMapping(this.getMapping())) {
      return "Some entries are invalid in your columns mapping.";
    }
    return error;
  };

  // Settings
  handleSaveSettings = async () => {
    this.setState({
      displaySettings: false,
      initialized: !!this.state.token
    });
    await Service.setUserProp({
      key: "token",
      value: this.state.token
    });
    this.bootstrap(this.state.index);
  };

  toggleSettings = () =>
    this.setState({
      displaySettings: !this.state.displaySettings
    });

  // Token
  handleChangeToken = (token: string) => this.setState({ token });

  handleReset = async () => {
    this.setState({
      loading: false,
      initialized: false,
      displaySettings: true
    });
    await Service.clearProperties();
    this.bootstrap(this.state.index);
  };

  handleReloadColumns = () => this.bootstrap(this.state.index);

  saveConfig = async (options?: { reload: boolean }) => {
    this.setState({ saving: true });
    const { index } = this.state;
    if (!index) {
      return;
    }
    const newState = {
      index,
      data: _.pick(this.state, ...SAVED_CONFIG)
    };
    console.log("SAVING USER PROPS", newState);
    const state = await Service.saveConfig(newState);
    console.log("SAVED AND RECEIVED", state);
    if (options && options.reload) {
      this.setState(state);
    } else {
      this.setState(_.pick(state, ["googleColumns", "hullAttributes"]));
    }
    this.setState({ loading: false, saving: false });
  };

  autoSaveConfig = _.debounce(this.saveConfig, 1000);

  updateConfig = (newState: {}, options?: { reload: boolean }) =>
    this.setState(newState, () => this.autoSaveConfig(options));

  // Source
  handleChangeSource = (source: string) => this.updateConfig({ source });

  // Mapping
  handleAddMapping = () => {
    const mapping = [
      ...this.getMapping(),
      {
        hull: "",
        column: 0
      }
    ];
    this.updateConfig({
      [this.getMappingType()]: mapping
    });
  };

  handleRemoveMapping = ({ index }: { index: number }) => {
    const mapping = [...this.getMapping()];
    mapping.splice(index, 1);
    this.updateConfig({
      [this.getMappingType()]: mapping
    });
  };

  handleChangeMapping = ({
    value,
    index
  }: {
    value: MappingType,
    index: number
  }) => {
    const mapping = [...this.getMapping()];
    mapping[index] = { ...value };
    this.updateConfig({
      [this.getMappingType()]: mapping
    });
  };

  // Claims
  handleChangeClaim = (newClaims: ClaimsType) => {
    this.updateConfig({
      [this.getClaimsType()]: {
        ...this.getClaims(),
        ...newClaims
      }
    });
  };

  // Type
  handleChangeType = (type: ImportType) =>
    this.setState({ loading: true }, () =>
      this.updateConfig({ type }, { reload: true })
    );

  // Imports
  handleClearImportStatus = () => this.setState({ importStatus: undefined });

  handleStartImport = async () => {
    this.setState({
      importing: true,
      importStatus: "working"
    });
    const { index, type, source } = this.state;
    try {
      await Service.importData({
        index,
        type,
        mapping: this.getMapping().map(({ hull, column }) => ({
          hull: addSource(source, hull),
          column
        })),
        claims: this.getClaims()
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
      displaySettings,
      googleColumns,
      hullAttributes,
      hullGroups,
      importProgress,
      importStatus,
      loading,
      initialized,
      source,
      token,
      type,
      importing
    } = this.state;

    if (!loading && (!initialized || displaySettings)) {
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

    if (importing || importStatus) {
      return (
        <ImportStatus
          importStatus={importStatus}
          importProgress={importProgress}
          clearImportStatus={this.handleClearImportStatus}
        />
      );
    }

    return (
      <div style={{ paddingBottom: "5em", paddingTop: "1em" }}>
        <Type type={type} onChange={this.handleChangeType} />
        <Claims
          valid={true}
          type={type}
          claims={this.getClaims()}
          googleColumns={googleColumns}
          onChangeRow={this.handleChangeClaim}
        />
        {hullAttributes && googleColumns && (
          <Fragment>
            <Source
              sources={hullGroups}
              source={source}
              onChange={this.handleChangeSource}
            />
            <Mapping
              mapping={filterMapping(source, this.getMapping())}
              source={source}
              sources={hullGroups}
              loading={loading}
              hullAttributes={filterAttributes(source, hullAttributes)}
              googleColumns={googleColumns}
              onChangeRow={this.handleChangeMapping}
              onRemoveRow={this.handleRemoveMapping}
              onAddRow={this.handleAddMapping}
            />
          </Fragment>
        )}
      </div>
    );
  }

  render() {
    const {
      initialized,
      loading,
      type,
      saving,
      displaySettings,
      index,
      range = {},
      name = ""
    } = this.state;

    const error = this.getError();

    if (!index) {
      return <Spinner />;
    }

    return (
      <div>
        <div className="sidebar">
          <div>
            <p>
              {(loading && "Loading...") ||
                (saving && "Saving...") ||
                (name && `Current Sheet: ${name}`)}
            </p>
            <Actions
              saving={saving}
              loading={loading}
              valid={this.isValid()}
              claims={this.getClaims()}
              type={type}
              range={range}
              displaySettings={displaySettings}
              initialized={initialized}
              onReloadColumns={this.handleReloadColumns}
              onToggleSettings={this.toggleSettings}
              onStartImport={this.handleStartImport}
            />
            {error && (
              <p>
                <span className="error">{error}</span>
              </p>
            )}
          </div>
          {this.renderMain()}
        </div>
      </div>
    );
  }
}

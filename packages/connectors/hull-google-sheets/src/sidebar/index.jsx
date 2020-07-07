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

const sanitizeAttribute = (str: string) =>
  str.replace(/[ $%&*\.]/g, "_").toLowerCase();

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
    hullGroups: [],
    range: {}
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
        started: true,
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
    const { initialized, error } = this.state;
    if (!initialized) return undefined;
    return error;
  };

  // Settings
  handleSaveSettings = async () => {
    this.setState({
      displaySettings: false,
      savingSettings: true,
      initialized: !!this.state.token
    });
    await Service.setUserProp({
      key: "token",
      value: this.state.token
    });
    await this.bootstrap(this.state.index);
    this.setState({
      savingSettings: false
    });
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
        hull: sanitizeAttribute(this.state.googleColumns[0]),
        isNew: true,
        column: 0
      }
    ];
    console.log("ADDMAPPING", mapping);
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
    const previousMapping = mapping[index];
    // ChangedService
    if (previousMapping.isNew && previousMapping.column !== value.column) {
      mapping[index] = {
        ...value,
        isNew: true,
        hull: sanitizeAttribute(this.state.googleColumns[value.column])
      };
    } else {
      // Changed Hull
      mapping[index] = { ..._.omit(value, "isNew") };
    }
    // mapping[index] = { ...(value.isNew ? value : value) };
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
      setTimeout(() => {
        this.setState({
          importStatus: undefined
        });
      }, 2000);
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

    const mapping = this.getMapping();
    return (
      <div style={{ paddingBottom: "5em", paddingTop: "1em" }}>
        <ImportStatus
          importStatus={importStatus}
          importProgress={importProgress}
        />
        <Type type={type} onChange={this.handleChangeType} />
        <Claims
          valid={true}
          type={type}
          errors={
            !isValidClaims(this.getClaims()) && [
              `You need to configure at least one claim to resolve ${type} identities`
            ]
          }
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
              mapping={filterMapping(source, mapping)}
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

  getSpinnerMessage() {
    if (this.state.savingSettings) {
      return "Saving Settings...";
    }
    if (this.state.loading) {
      return "Loading Settings...";
    }
    return "Loading...";
  }

  render() {
    const {
      initialized,
      loading,
      type,
      saving,
      savingSettings,
      displaySettings,
      index,
      started,
      range = {},
      name = ""
    } = this.state;

    const error = this.getError();

    if (savingSettings || !started || !index) {
      return <Spinner message={this.getSpinnerMessage()} />;
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
          {!loading && this.renderMain()}
        </div>
      </div>
    );
  }
}

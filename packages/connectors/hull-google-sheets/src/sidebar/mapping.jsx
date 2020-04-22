// @flow

import React, { Component } from "react";
import _ from "lodash";
import MappingLine from "./mapping-line";
import type {
  ImportType,
  HullAttributes,
  AttributeMapping,
  GoogleColumns
} from "../../types";

const USER_CLAIMS = ["email", "external_id", "anonymous_id"];
const ACCOUNT_CLAIMS = ["domain", "external_id", "anonymous_id"];

type Props = {
  type?: ImportType,
  source?: string,
  onStartImport: () => Promise<void>,
  hullAttributes?: HullAttributes,
  googleColumns?: GoogleColumns,
  mapping: AttributeMapping,
  claims: AttributeMapping,
  onChange: ({
    target: "mapping" | "claims",
    value: string,
    index: number
  }) => void
};

type State = {};
type ColumnMapping = [string, { hull: string, enabled: boolean }];

class Mapping extends Component<Props, State> {
  getMappings(): Array<ColumnMapping> {
    const { googleColumns = [], mapping = [] } = this.props;
    return _.zip(googleColumns, mapping).map(([colName, mappingLine]) => [
      colName,
      mappingLine || {}
    ]);
  }

  getHullFieldOptions(additionalField) {
    const { hullAttributes = [] } = this.props;
    return _.compact(_.uniq(hullAttributes.concat([additionalField]))).map(
      value => ({
        value,
        label: value.replace(/^traits_/, "").replace(/^account\./, "Account > ")
      })
    );
  }

  getMappedField = name => {
    const { googleColumns = [], mapping = [] } = this.props;
    const idx = _.findIndex(
      mapping,
      m => m && m.enabled && m.hullField === name
    );
    const column = idx > -1 && googleColumns[idx];
    return column && { idx, column, mapping: mapping[idx] };
  };

  getClaims = (): Array<string> => {
    const { type = "user" } = this.props;
    return type === "user" || type === "user_event"
      ? USER_CLAIMS
      : ACCOUNT_CLAIMS;
  };

  handleChangeMapping = (index: number, e: any) =>
    this.props.onChange({
      target: "mapping",
      value: e ? e.value : null,
      index
    });

  handleChangeClaims = (index: number, e: any) =>
    this.props.onChange({
      target: "claims",
      value: e ? e.value : null,
      index
    });

  handleChangeEntityType = e => this.props.onChangeEntityType(e.target.value);

  handleChangeSource = e => {
    console.log(e.target.value);
  };

  renderMappedField = (name: string) => {
    const mapped = this.getMappedField(name);
    if (mapped) {
      return (
        <p>
          <b>{name}</b> field mapped to <b>{mapped.column}</b> column
        </p>
      );
    }

    return (
      <p className="grey">
        <b>{name}</b> missing
      </p>
    );
  };

  isClaimsValid = () => _.some(this.getClaims(), v => !!this.props.claims[v]);

  renderClaims() {
    const { claims } = this.props;
    const isClaimsValid = this.isClaimsValid();

    // this.getMandatory().map(this.renderMappedField)

    if (!isClaimsValid) {
      return (
        <p>
          At least one of those two fields has to be linked for the import to be
          possible
        </p>
      );
    }

    return _.map(this.getClaims(), claim => (
      <tr key={claim}>
        <td>{claim}</td>
        <td>
          <input
            style={{ width: "100%" }}
            type="text"
            id={claim}
            value={claims[claim]}
            onChange={this.handleChangeClaims}
          />
        </td>
      </tr>
    ));
  }

  render() {
    const { type = "user", source = "google_sheet" } = this.props;
    return (
      <div style={{ paddingBottom: "5em" }}>
        <table style={{ width: "100%" }}>
          <tr>
            <td style={{ width: "92px" }}>
              <h4>Import Type : </h4>
            </td>
            <td>
              <select
                style={{ width: "100%" }}
                value={type}
                onChange={this.handleChangeEntityType}
              >
                <option value="user" default>
                  Users
                </option>
                <option value="account">Accounts</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>
              <h4>Import Group : </h4>
            </td>
            <td>
              <input
                style={{ width: "100%" }}
                type="text"
                id="source"
                value={source}
                onChange={this.handleChangeSource}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <h4>Fields used to identify {type}</h4>
              {this.renderClaims()}
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <h4>Columns mapping</h4>
              <p>
                Pick names of attributes or create new ones. Attributes will be
                stored in the group above
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              {this.getMappings().map(([google, { enabled, hull }], idx) => (
                <MappingLine
                  key={idx}
                  enabled={enabled}
                  hull={hull}
                  google={google}
                  options={this.getHullFieldOptions(hull)}
                  onChange={this.handleChangeMapping}
                  idx={idx}
                />
              ))}
            </td>
          </tr>
        </table>
        <div className="form-group">
          <div>
            <button
              className="blue"
              disabled={!this.isClaimsValid()}
              onClick={this.props.onStartImport}
            >
              Start Import
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Mapping;

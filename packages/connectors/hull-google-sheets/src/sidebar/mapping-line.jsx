// @flow

import React, { PureComponent } from "react";
import Creatable from "react-select/creatable";
// import Select from "react-select";
import _ from "lodash";
import SVG from "react-inlinesvg";
import type { AttributeMapping } from "../../types";

type MappingProp = {
  column: number,
  hull: string,
  idx: number,
  destinationOptions: Array<string>,
  sourceOptions: Array<string>,
  mapping?: AttributeMapping,
  enabled?: boolean,
  onChange: (number, any) => void,
  onRemove: (number, any) => void
};

const toOptions = (value: string) => ({ value, label: value });
const isOptionDisabled = (mapping: AttributeMapping) => ({
  value
}: {
  value: string
}): boolean => !!_.some(mapping, { hull: value });

export default class MappingLine extends PureComponent<MappingProp> {
  handleUpdateHull = ({ value }: any) =>
    this.props.onChange(this.props.idx, {
      hull: value,
      column: this.props.column
    });

  handleUpdateService = ({ currentTarget }: SyntheticEvent<>) => {
    // $FlowFixMe
    const { value } = currentTarget;
    this.props.onChange(this.props.idx, {
      hull: this.props.hull,
      column: value
    });
  };

  handleRemove = () => this.props.onRemove(this.props.idx);

  render() {
    const {
      column,
      hull,
      sourceOptions,
      destinationOptions,
      mapping = []
    } = this.props;
    return (
      <tr>
        <td colSpan={2} className="no-style mapping-line">
          <div className="map-google">
            <SVG
              className="service-icon"
              src={require("../icons/google-sheets.svg")}
            />
            <select value={column} onChange={this.handleUpdateService}>
              {sourceOptions.map((o, i) => (
                <option key={i} value={i}>
                  {o}
                </option>
              ))}
            </select>

            <div
              className="button red remove mapping__remove-row"
              onClick={this.handleRemove}
            >
              <SVG className="icon" src={require("../icons/trash.svg")} />
            </div>
          </div>
          <div className="map-hull">
            <SVG className="service-icon" src={require("../icons/hull.svg")} />
            <Creatable
              isSearchable
              isOptionDisabled={isOptionDisabled(mapping)}
              allowCreateWhileLoading
              defaultValue={toOptions(hull || sourceOptions[column])}
              options={(destinationOptions || []).map(toOptions)}
              onChange={this.handleUpdateHull}
            />
          </div>
        </td>
      </tr>
    );
  }
}

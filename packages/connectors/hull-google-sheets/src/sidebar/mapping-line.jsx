// @flow

import React, { PureComponent } from "react";
import Creatable from "react-select/creatable";
// import Select from "react-select";
import _ from "lodash";
import GoogleSheets from "../icons/google-sheets.svg";
import Trash from "../icons/trash";
import type { AttributeMapping } from "../../types";

type MappingProp = {
  service: string,
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
      service: this.props.service
    });

  handleUpdateService = ({ currentTarget }: SyntheticEvent<>) => {
    // $FlowFixMe
    const { value } = currentTarget;
    this.props.onChange(this.props.idx, {
      hull: this.props.hull,
      service: value
    });
  };

  handleRemove = () => this.props.onRemove(this.props.idx);

  render() {
    const {
      service,
      hull,
      sourceOptions,
      destinationOptions,
      mapping = []
    } = this.props;

    return (
      <tr>
        <td colSpan={2} className="no-style mapping-line">
          <div className="map-google">
            <GoogleSheets />
            <select value={service} onChange={this.handleUpdateService}>
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
              <Trash />
            </div>
          </div>
          <div className="map-hull">
            <span className="title"> ➜ </span>
            <Creatable
              isSearchable
              isOptionDisabled={isOptionDisabled(mapping)}
              allowCreateWhileLoading
              defaultValue={{
                value: hull,
                label: hull
              }}
              options={(destinationOptions || []).map(toOptions)}
              onChange={this.handleUpdateHull}
            />
          </div>
        </td>
      </tr>
    );
  }
}

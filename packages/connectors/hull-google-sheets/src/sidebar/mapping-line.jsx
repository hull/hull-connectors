// @flow

import { PureComponent } from "react";
import Creatable from "react-select/creatable";
import SVG from "react-inlinesvg";
import hasInvalidCharacters from "../lib/has-invalid-characters";
import {
  validationErrors,
  isOptionDisabled,
  toOptions
} from "../lib/filter-utils";
import Errors from "./mapping-errors";
import type { AttributeMapping } from "../../types";

type MappingProp = {
  column: number,
  hull: string,
  source?: string,
  idx: number,
  destinationOptions: Array<string>,
  sourceOptions: Array<string>,
  mapping?: AttributeMapping,
  enabled?: boolean,
  onChange: (number, any) => void,
  onRemove: (number, any) => void
};

const ERROR_STYLE = {
  borderColor: "rgb(233, 0, 51)",
  background: "rgb(255, 237, 237)"
};
const NEW_STYLE = {
  borderColor: "rgb(0, 144, 233)",
  background: "rgb(237, 248, 255)"
};

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

  getNewOptionData = (value: string, label: string) => ({
    value,
    label
  });

  getOptionLabel = ({ value }) =>
    this.props.source ? `${this.props.source}/${value}` : value;

  getLabel = ({
    label,
    value,
    __isNew__
  }: {
    value: string,
    label: string,
    __isNew__?: boolean
  }) => (__isNew__ ? `Create "${value}"` : label);

  formatCreateLabel = value =>
    `Create ${this.props.source ? `${this.props.source}/${value}` : value}`;

  isValidNewOption = (inputValue: string) =>
    !hasInvalidCharacters(inputValue).length;

  handleRemove = () => this.props.onRemove(this.props.idx);

  getControlStyle = (control: {}) => {
    if (!this.isValidNewOption(this.props.hull))
      return { ...control, ...ERROR_STYLE };
    if (this.props.destinationOptions.indexOf(this.props.hull) < 0)
      return { ...control, ...NEW_STYLE };
    return control;
  };

  render() {
    const {
      column,
      hull,
      sourceOptions,
      destinationOptions,
      mapping = []
    } = this.props;

    const invalidChars = validationErrors({ hull });
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
              styles={{
                control: this.getControlStyle
              }}
              noOptionsMessage={() => "Enter something"}
              getNewOptionData={this.getNewOptionData}
              formatCreateLabel={this.formatCreateLabel}
              isOptionDisabled={isOptionDisabled(mapping)}
              getOptionLabel={this.getOptionLabel}
              defaultValue={toOptions(sourceOptions[column])}
              value={toOptions(hull)}
              options={(destinationOptions || []).map(toOptions)}
              onChange={this.handleUpdateHull}
            />
          </div>
          <Errors errors={invalidChars} />
        </td>
      </tr>
    );
  }
}

// @flow

import React, { Fragment, Component } from "react";
import _ from "lodash";
import MappingLine from "./mapping-line";
import type {
  ImportType,
  HullAttributes,
  MappingType,
  AttributeMapping,
  GoogleColumns
} from "../../types";

type Props = {
  type?: ImportType,
  source?: string,
  hullAttributes?: HullAttributes,
  googleColumns?: GoogleColumns,
  mapping?: AttributeMapping,
  loading?: boolean,
  onAddRow: any => void,
  onRemoveRow: ({ index: number }) => void,
  onChangeRow: ({ value: MappingType, index: number }) => void
};

type State = {};

class Mapping extends Component<Props, State> {
  getHullFieldOptions(additionalField: string): Array<string> {
    const { hullAttributes = [] } = this.props;
    return _.compact(_.uniq(hullAttributes.concat([additionalField])));
  }

  getMappedField = (name: string) => {
    const { googleColumns = [], mapping = [] } = this.props;
    const idx = _.findIndex(
      mapping,
      m => m && m.enabled && m.hullField === name
    );
    const column = idx > -1 && googleColumns[idx];
    return column && { idx, column, mapping: mapping[idx] };
  };

  handleRemove = (index: number) =>
    this.props.onRemoveRow({
      index
    });

  handleChange = (index: number, value: any) =>
    this.props.onChangeRow({
      value,
      index
    });

  handleAddRow = () => this.props.onAddRow();

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

  render() {
    const { loading, mapping = [], googleColumns = [] } = this.props;
    return (
      <Fragment>
        <h4>Columns mapping</h4>
        <p>
          Pick names of attributes or create new ones. Attributes will be stored
          in the group above
        </p>
        <table className="full-width">
          <tbody>
            {mapping.map(({ hull, service }, idx) => (
              <MappingLine
                mapping={mapping}
                key={idx}
                enabled={true}
                hull={hull}
                service={service}
                sourceOptions={googleColumns}
                destinationOptions={this.getHullFieldOptions(hull)}
                onChange={this.handleChange}
                onRemove={this.handleRemove}
                idx={idx}
              />
            ))}
            <tr>
              <td colSpan={2}>
                <button disabled={loading} onClick={this.handleAddRow}>
                  + Add new row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </Fragment>
    );
  }
}

export default Mapping;

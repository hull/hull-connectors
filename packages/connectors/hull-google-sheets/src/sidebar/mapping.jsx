// @flow

import React, { Fragment, Component } from "react";
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
  handleRemove = (index: number) =>
    this.props.onRemoveRow({
      index
    });

  handleChange = (index: number, value: { hull: string, column: number }) => {
    this.props.onChangeRow({
      value,
      index
    });
  };

  handleAddRow = () => this.props.onAddRow();

  render() {
    const {
      type,
      source,
      loading,
      mapping = [],
      googleColumns = [],
      hullAttributes = []
    } = this.props;
    const description = "Pick names of attributes or create new ones.";
    const eventDescription = "Map columns to event properties";
    return (
      <Fragment>
        <h4>Columns mapping</h4>
        <p>{type === "user_event" ? eventDescription : description}</p>
        <table className="full-width">
          <tbody>
            {mapping.map(({ hull = "", column }, idx) => (
              <MappingLine
                mapping={mapping}
                hull={hull}
                key={idx}
                source={source}
                enabled={true}
                column={column}
                sourceOptions={googleColumns}
                destinationOptions={hullAttributes}
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

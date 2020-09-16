/* eslint-disable react/prop-types */
// @flow

/* eslint-disable react/no-multi-comp */
import _ from "lodash";
import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { utils } from "@rjsf/core";
const { getUiOptions } = utils;

export function canExpand(schema, uiSchema, formData) {
  if (!schema.additionalProperties) {
    return false;
  }
  const { expandable } = getUiOptions(uiSchema);
  if (expandable === false) {
    return expandable;
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
}
type Props = {
  TitleField: React$Node,
  DescriptionField: React$Node,
  title: string,
  uiSchema: {},
  idSchema: {},
  formData: {},
  formContext: {},
  description: string,
  required?: boolean,
  properties: Array<{}>
};

type State = {
  show: boolean
};

export default class FallbackFieldTemplate extends Component<Props, State> {
  state = {
    show: false
  };

  handleOpenModal = () => {
    this.setState({ show: true });
  };

  handleCloseModal = () => {
    this.setState({ show: false });
  };

  getPreview = key => {
    const preview = _.get(this.props.formContext, [
      "current",
      "result",
      "traits",
      key
    ]);
    if (preview !== undefined) {
      return <Badge variant="success">{JSON.stringify(preview)}</Badge>;
    }
    return <Badge variant="secondary">No value</Badge>;
  };

  render() {
    const { props } = this;
    const {
      TitleField,
      DescriptionField,
      title,
      formData,
      formContext,
      uiSchema,
      idSchema,
      description,
      required,
      properties
    } = props;

    const key = formData.target;
    return (
      <div id={idSchema.$id} className="field_object_row">
        {(uiSchema["ui:title"] || title) && (
          <TitleField
            id={`${idSchema.$id}__title`}
            title={title || uiSchema["ui:title"]}
            required={required}
            formContext={formContext}
          />
        )}

        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Computed Attribute Name</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            value={key}
            disabled
            placeholder={uiSchema.target["ui:placeholder"]}
          />
          <InputGroup.Append>
            <InputGroup.Text>{this.getPreview(key)}</InputGroup.Text>
            <Button onClick={this.handleOpenModal} variant="primary">
              Edit
            </Button>
          </InputGroup.Append>
        </InputGroup>

        {description && (
          <DescriptionField
            id={`${idSchema.$id}__description`}
            description={description}
            formContext={formContext}
          />
        )}
        <Modal
          centered
          dialogClassName="fallbacks_modal"
          size="lg"
          show={this.state.show}
          onHide={this.handleCloseModal}
        >
          <Modal.Header closeButton>Edit Computed Attribute</Modal.Header>
          <Modal.Body>{properties.map(prop => prop.content)}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleCloseModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* {canExpand(schema, uiSchema, formData) && (
            <IconButton
              type="info"
              icon="plus"
              className="btn-add btn-secondary btn-sm col-xs-12"
              aria-label="Add"
              tabIndex="0"
              onClick={props.onAddClick(props.schema)}
              disabled={props.disabled || props.readonly}
            />
          )} */}
      </div>
    );
  }
}

/* eslint-disable react/prop-types */
// @flow

/* eslint-disable react/no-multi-comp */
import _ from "lodash";
import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

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

export default class ComputedAttributesFieldTemplate extends Component<
  Props,
  State
> {
  state = {
    show: false
  };

  handleOpenModal = () => {
    this.setState({ show: true });
  };

  handleCloseModal = () => {
    this.setState({ show: false });
  };

  getPreview = (key: string) => {
    const preview = _.get(this.props.formContext, [
      "current",
      "result",
      "traits",
      key
    ]);

    if (!key || preview === undefined) {
      return "[No change]";
    }
    if (preview === null) {
      return "[null value]";
    }
    if (_.isObject(preview) || _.isArray(preview)) {
      return JSON.stringify(preview);
    }
    return preview;
  };

  render() {
    const { props } = this;
    const { formData, idSchema, properties } = props;

    const { computed_attribute, type } = formData;
    const modalProps = _.tail(properties);
    const attribute = _.find(properties, { name: "computed_attribute" });
    // const type = _.find(properties, { name: "type" });
    return (
      <div id={idSchema.$id} className="field_object_row">
        <Row className="computed_attributes_row">
          <Col md={4}>{attribute.content}</Col>
          <Col className="computed_attributes_value">
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>Preview:</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                value={this.getPreview(computed_attribute)}
                disabled
              />
              <InputGroup.Append>
                <InputGroup.Text>
                  <Badge variant="primary">{type}</Badge>
                </InputGroup.Text>
                <Button
                  disabled={!computed_attribute}
                  onClick={this.handleOpenModal}
                  variant="primary"
                >
                  Edit
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
        <Modal
          centered
          dialogClassName="computed_attributes_modal"
          size="lg"
          show={this.state.show}
          onHide={this.handleCloseModal}
        >
          <Modal.Header closeButton>
            <Row>
              <Col md={5}>
                <InputGroup size="sm">
                  <InputGroup.Prepend>
                    <InputGroup.Text>Attribute Name:</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl value={computed_attribute} disabled />
                </InputGroup>
              </Col>
              <Col md={7}>
                <InputGroup size="sm">
                  <InputGroup.Prepend>
                    <InputGroup.Text>Preview:</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl
                    value={this.getPreview(computed_attribute)}
                    disabled
                  />
                </InputGroup>
              </Col>
            </Row>
          </Modal.Header>
          <Modal.Body>{modalProps.map(prop => prop.content)}</Modal.Body>
        </Modal>
      </div>
    );
  }
}

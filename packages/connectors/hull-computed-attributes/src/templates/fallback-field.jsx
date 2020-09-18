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
    if (_.isObject(preview) || _.isArray(preview)) {
      return JSON.stringify(preview);
    }
    return preview;
  };

  render() {
    const { props } = this;
    const { formData, idSchema, properties } = props;

    const key = formData.target;
    const modalProps = _.tail(properties);
    const target = _.head(properties);
    return (
      <div id={idSchema.$id} className="field_object_row">
        <Container fluid>
          <Row noGutters className="fallback_row">
            <Col md={4}>{target.content}</Col>
            <Col className="fallback_value">
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Preview:</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl value={this.getPreview(key)} disabled />
                <InputGroup.Append>
                  <Button
                    disabled={!key}
                    onClick={this.handleOpenModal}
                    variant="primary"
                  >
                    Edit
                  </Button>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Row>
        </Container>
        <Modal
          centered
          dialogClassName="fallbacks_modal"
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
                  <FormControl value={key} disabled />
                </InputGroup>
              </Col>
              <Col md={7}>
                <InputGroup size="sm">
                  <InputGroup.Prepend>
                    <InputGroup.Text>Preview:</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl value={this.getPreview(key)} disabled />
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

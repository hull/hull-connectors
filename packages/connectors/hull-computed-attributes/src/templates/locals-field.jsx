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

export default class LocalsFieldTemplate extends Component<Props, State> {
  getPreview = (key: string) => {
    const preview = _.get(this.props.formContext, [
      "current",
      "result",
      "data",
      key
    ]);

    if (!key || preview === undefined) {
      return "[No value]";
    }
    if (_.isObject(preview) || _.isArray(preview)) {
      return JSON.stringify(preview);
    }
    return preview;
  };

  render() {
    const { props } = this;
    const { TitleField, formData, schema, idSchema, properties } = props;

    const key = formData.target;
    const target = properties[0];
    const source = properties[1];
    return (
      <div id={idSchema.$id} className="field_object_row">
        <Container fluid>
          <Row className="locals_row">
            <Col md={4}>
              <TitleField title={schema.properties.target.title} />
              {target.content}
            </Col>
            <Col md={4}>
              <TitleField title={schema.properties.source.title} />
              {source.content}
            </Col>
            <Col md={4}>
              <TitleField title="Preview" />
              <FormControl value={this.getPreview(key)} disabled />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

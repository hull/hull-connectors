// @flow
/* eslint-disable jsx-a11y/accessible-emoji */

import React, { Component, Fragment } from "react";
import { InputGroup, FormControl, ListGroup } from "react-bootstrap";
import _ from "lodash";

type Header = {
  name: string,
  value: string
};
type Props = {
  url: string,
  headers: Array<Header>,
  cookies: Array<string>,
  body: string,
  format: string,
  sync_interval: string,
  method: string
};

const ListItem = ({ text }) => (
  <ListGroup.Item>
    <pre>{text}</pre>
  </ListGroup.Item>
);

const Group = ({ items, title }) =>
  !!_.compact(items).length && (
    <Fragment>
      <h5>{title}</h5>
      <ListGroup>
        {_.compact(items).map((text, i) => (
          <ListItem text={text} key={i} />
        ))}
      </ListGroup>
      <hr />
    </Fragment>
  );

export default class ModalBody extends Component<Props> {
  autoSelect = (e: any) => {
    e.target.focus();
    e.target.select();
  };

  render() {
    const {
      url,
      headers,
      cookies,
      body,
      format,
      sync_interval,
      method,
      computing
    } = this.props;
    return (
      <div>
        <p>Configure the call in the Settings tab</p>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>{method.toUpperCase()}</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            type="text"
            onClick={this.autoSelect}
            rows={1}
            value={url}
            readOnly
            data-autoselect=""
          />
        </InputGroup>
        <hr />
        <Group
          items={headers.map(({ name, value }) => `${name}: ${value}`)}
          title="Headers"
        />
        <Group items={cookies} title="Cookies" />
        {body && (
          <Fragment>
            <h5>Body</h5>
            <FormControl as="textarea" value={body} />
          </Fragment>
        )}
        <hr />
        <h5>Response Format: {format}</h5>
      </div>
    );
  }
}

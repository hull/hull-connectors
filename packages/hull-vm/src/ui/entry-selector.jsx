// @flow
import React, { Fragment } from "react";
import FormControl from "react-bootstrap/FormControl";
import Col from "react-bootstrap/Col";
import type { Entry } from "../../types";

const getTitle = (strings, entityType = "user") =>
  strings[
    entityType === "user" ? "leftColumnTitleUser" : "leftColumnTitleAccount"
  ];

const List = ({
  onChange,
  defaultValue,
  title
}: {
  defaultValue?: string,
  current?: Entry,
  recent?: Array<Entry>,
  loading: boolean,
  title: string,
  onChange: () => void
}) => (
  <Fragment>
    <Col xs={12}>
      <FormControl
        size="sm"
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={title}
        aria-label={title}
        aria-describedby="basic-addon1"
      />
    </Col>
  </Fragment>
);
export default List;

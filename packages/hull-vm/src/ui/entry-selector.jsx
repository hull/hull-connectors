// @flow
import React, { Fragment } from "react";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import _ from "lodash";
import type { Entry } from "../../types";
import PayloadTitle from "./payload-title";
import Sync from "./sync";
import Spinner from "./spinner";

const List = ({
  loading,
  onChange,
  recent = [],
  current
}: {
  current?: Entry,
  recent?: Array<Entry>,
  loading: boolean,
  onChange: () => void
}) => (
  <Fragment>
    <Col xs={6}>
      <FormControl
        size="sm"
        onChange={onChange}
        placeholder="Email or Id"
        aria-label="Email or Id"
        aria-describedby="basic-addon1"
      />
    </Col>
  </Fragment>
);
export default List;
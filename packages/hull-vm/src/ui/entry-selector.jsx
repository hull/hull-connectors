// @flow
import React, { Fragment } from "react";
import FormControl from "react-bootstrap/FormControl";
import Col from "react-bootstrap/Col";
import _ from "lodash";
import Select from "react-select";
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
    <Col xs={8}>
      <FormControl
        onChange={onChange}
        placeholder="Email or Id"
        aria-label="Email or Id"
        aria-describedby="basic-addon1"
      />
    </Col>
  </Fragment>
);
export default List;

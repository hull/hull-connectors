// @flow
import React, { Fragment } from "react";

import Col from "react-bootstrap/Col";
import Select, { components } from "react-select";
import type { Entry } from "../../types";
import Spinner from "./spinner";
import styles from "./react-select-styles";

const ValueContainer = ({ children, getValue, ...props }) => {
  const valueLength = getValue().length;
  const text =
    !props.selectProps.inputValue &&
    (valueLength
      ? `${valueLength} Event${valueLength != 1 ? "s" : ""} selected`
      : null);

  return (
    <components.ValueContainer {...props} getValue={getValue}>
      {text}
      {children}
    </components.ValueContainer>
  );
};

const NoOptionsMessage = props => (
  <Tooltip content="Couldn't load Events. Try reloading">
    <components.NoOptionsMessage {...props} />
  </Tooltip>
);

const MultiValue = () => null;

const List = ({
  events,
  loading,
  onChange
}: {
  events: Array<{ label: string, value: string }>,
  loading: boolean,
  onChange: () => void
}) => (
  <Fragment>
    <Col xs={12}>
      <Select
        isMulti={true}
        isSearchable={true}
        classNamePrefix="react-select"
        placeholder={"Pick Events to display in preview"}
        components={{
          NoOptionsMessage,
          ValueContainer,
          MultiValue
        }}
        options={events}
        styles={styles}
        isLoading={loading}
        onChange={onChange}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
      />
    </Col>
  </Fragment>
);

export default List;

// @flow
import React, { Fragment } from "react";

import Col from "react-bootstrap/Col";
import Select, { components } from "react-select";
import type { Entry } from "../../types";
import Spinner from "./spinner";

const backgroundColor = "#13151a";
const dark = "#111";
const disabled = "#444";
const selected = "#2684FF";
const noBorder = {
  border: "0",
  ":active": { boxShadow: 0, border: 0 },
  ":focus": { boxShadow: 0, border: 0 },
  ":hover": { boxShadow: 0, border: 0 }
};
const styles = {
  menu: s => ({ ...s, backgroundColor: "black" }),
  valueContainer: s => ({
    ...s,
    padding: "6px 8px",
    backgroundColor,
    cursor: "pointer"
  }),
  menuList: s => ({ ...s, backgroundColor }),
  container: s => ({
    ...s,
    ...noBorder
  }),
  control: s => ({
    ...s,
    ...noBorder,
    backgroundColor,
    minHeight: "31px",
    borderRadius: "0.5rem",
    ">div": {
      borderRadius: "0.5rem"
    }
  }),
  indicatorsContainer: s => ({
    ...s,
    color: "#444"
  }),
  indicatorContainer: () => ({
    padding: "5px 8px"
  }),
  indicatorSeparator: s => ({
    ...s,
    backgroundColor: "#444"
  }),
  option: (s, { isDisabled, isSelected }) => ({
    ...s,
    cursor: "pointer",
    color: isSelected ? selected : isDisabled ? "#666" : "#CCC",
    backgroundColor: isDisabled ? disabled : backgroundColor,
    ":active": {
      backgroundColor: dark
    },
    ":hover": {
      backgroundColor: isDisabled ? disabled : dark
    }
  }),
  multiValue: (s, { data }) => ({
    ...s,
    backgroundColor: "#ffffff22",
    borderRadius: "0.5rem"
  }),
  multiValueLabel: (s, { data }) => ({
    ...s,
    color: "#ccc"
  }),
  multiValueRemove: (s, { data }) => ({
    ...s,
    color: "#FFF",
    ":hover": {
      backgroundColor: dark,
      cursor: "pointer"
    }
  })
};

const ValueContainer = ({ children, getValue, ...props }) => {
  const valueLength = getValue().length;
  const text =
    !props.selectProps.inputValue &&
    (valueLength
      ? `${valueLength} Event${valueLength != 1 ? "s" : ""} selected`
      : "Select events to simulate in preview");

  return (
    <components.ValueContainer {...props} getValue={getValue}>
      {text}
      {React.Children.map(children, child => {
        return child.type === components.Input ? child : null;
      })}
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

// @flow
import React, { Fragment } from "react";
import _ from "lodash";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Select, { components } from "react-select";
import type { Entry } from "../../types";
import Spinner from "./spinner";

const options = [
  { value: "One", label: "One", selected: true },
  { value: "Two", label: "Two" },
  { value: "Three", label: "Three" }
];

const backgroundColor = "#13151a";
const dark = "#111";
const disabled = "#444";
const noBorder = {
  border: "0",
  ":active": { boxShadow: 0, border: 0 },
  ":focus": { boxShadow: 0, border: 0 },
  ":hover": { boxShadow: 0, border: 0 }
};
const styles = {
  menu: styles => ({ ...styles, backgroundColor: "black" }),
  valueContainer: styles => ({ ...styles, backgroundColor }),
  menuList: styles => ({ ...styles, backgroundColor }),
  container: styles => ({
    ...styles,
    ...noBorder
  }),
  control: styles => ({
    ...styles,
    ...noBorder,
    backgroundColor,
    borderRadius: "0.5rem",
    ">div": {
      borderRadius: "0.5rem"
    }
  }),
  indicatorsContainer: styles => ({
    ...styles,
    color: "#444"
  }),
  indicatorSeparator: styles => ({
    ...styles,
    backgroundColor: "#444"
  }),
  option: (styles, { isDisabled }) => ({
    ...styles,
    color: isDisabled ? "#666" : "#CCC",
    backgroundColor: isDisabled ? disabled : backgroundColor,
    ":active": {
      backgroundColor: dark
    },
    ":hover": {
      backgroundColor: isDisabled ? disabled : dark
    }
  }),
  multiValue: (styles, { data }) => ({
    ...styles,
    backgroundColor: "#ffffff22",
    borderRadius: "0.5rem"
  }),
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: "#ccc"
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: "#FFF",
    ":hover": {
      backgroundColor: dark,
      cursor: "pointer"
    }
  })
};
const ValueContainer = ({ getValue, children, ...props }) => (
  <components.ValueContainer {...props} getValue={getValue}>
    {getValue().length || "no"} events selected {children}
  </components.ValueContainer>
);
const MultiValue = () => null
const List = ({
  loading,
  onChange
}: {
  loading: boolean,
  onChange: () => void
}) => (
  <Fragment>
    <Col xs={6}>
      <Select
        components={{
          ValueContainer,
          MultiValue
        }}
        isOpen={true}
        options={options}
        styles={styles}
        isLoading={false}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
        isMulti
      />
    </Col>
  </Fragment>
);
export default List;

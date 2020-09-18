// @flow
import React from "react";
import Select from "react-select";
import { ReactSelectStyles } from "hull-vm/src/ui";

const getOptionValue = ({ key }) => key;
const getOptionLabel = ({ key, type }) => `${key} [${type}]`;

const formatOptionLabel = ({ key, type }) => (
  <span>
    {key} {type ? <i className="attribute_type">[{type}]</i> : undefined}
  </span>
);
const AttributeField = (schema = []) => props => {
  const onChange = ({
    key /* , type, visible, track_changes, configurable */
  }) => {
    props.onChange(key);
  };
  return (
    <Select
      isMulti={false}
      value={props.formData ? { key: props.formData } : undefined}
      isSearchable={true}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      formatOptionLabel={formatOptionLabel}
      classNamePrefix="react-select"
      className="react-select"
      placeholder={"Pick Attribute"}
      options={schema}
      styles={ReactSelectStyles}
      onChange={onChange}
      closeMenuOnSelect={true}
    />
  );
};
export default AttributeField;

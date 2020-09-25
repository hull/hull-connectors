// @flow
import React from "react";
import Select from "react-select";
import { ReactSelectStyles } from "hull-vm/src/ui";

const getOptionValue = ({ key }) => key;
const getOptionLabel = ({ key, type }) => `${key} [${type}]`;

type Props = {
  formContext: {
    getAttributeSchema: any
  },
  formData: {},
  onChange: any => void
};
const AttributeField = (props: Props) => {
  const { onChange, formData, formContext } = props;
  const { getAttributeSchema } = formContext;

  return (
    <Select
      isMulti={false}
      value={formData ? { key: formData } : undefined}
      isSearchable={true}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      formatOptionLabel={({ key, type }) => (
        <span>
          {key} {type ? <i className="attribute_type">[{type}]</i> : undefined}
        </span>
      )}
      classNamePrefix="react-select"
      className="react-select"
      placeholder={"Pick Attribute"}
      options={getAttributeSchema()}
      styles={ReactSelectStyles}
      onChange={({ key }) => onChange(key)}
      closeMenuOnSelect={true}
    />
  );
};
export default AttributeField;

// @flow
import React from "react";
import Select from "react-select";
import { ReactSelectStyles } from "hull-vm/src/ui";

const getOptionValue = ({ key }) => key;
const getOptionLabel = ({ key, type }) => `${key} [${type}]`;

type Props = {
  formContext: {
    getAttributeSchema: () => Array<any>,
    getArraySchema: () => Array<any>
  },
  schema: {
    title: string,
    types?: "array" | void,
    type: string
  },
  formData: {},
  onChange: any => void
};
const AttributeField = (props: Props) => {
  const { onChange, formData, formContext, schema } = props;
  const { types } = schema;
  const { getAttributeSchema } = formContext;
  const placeholder =
    types === "array" ? "Pick an Array attribute" : "Pick an attribute";
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
      placeholder={placeholder}
      options={getAttributeSchema({ types })}
      styles={ReactSelectStyles}
      onChange={({ key }) => onChange(key)}
      closeMenuOnSelect={true}
    />
  );
};
export default AttributeField;

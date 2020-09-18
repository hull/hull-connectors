// @flow

import _ from "lodash";
import React from "react";
import { utils } from "@rjsf/core";
import Select from "react-select";
import { ReactSelectStyles } from "hull-vm/src/ui";

const { asNumber, guessType } = utils;
const nums = new Set(["number", "integer"]);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue(schema, value) {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  }
  if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  }
  if (type === "boolean") {
    return value === "true";
  }
  if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every(x => guessType(x) === "number")) {
      return asNumber(value);
    }
    if (schema.enum.every(x => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
}

function getValue(options, multiple, value) {
  if (multiple) {
    return [].slice
      .call(options)
      .filter(o => o.selected)
      .map(o => o.value);
  }
  return value;
}
const getOptionValue = ({ value }) => processValue(value);

function SelectWidget(props) {
  const {
    schema,
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    label
  } = props;
  const { enumOptions, enumDisabled } = options;
  const emptyValue = multiple ? [] : {};
  const handleChange = ({ value = emptyValue }) =>
    onChange(processValue(schema, value));
  const handleFocus = event => onFocus(event);
  const handleBlur = event => onBlur(event);
  return (
    <Select
      isMulti={multiple}
      isSearchable={enumOptions.length > 5}
      value={
        typeof value === "undefined"
          ? emptyValue
          : _.find(enumOptions, { value })
      }
      className="react-select"
      classNamePrefix="react-select"
      placeholder={label}
      options={enumOptions}
      // getOptionValue={getOptionValue}
      styles={ReactSelectStyles}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      closeMenuOnSelect={true}
    />
  );
  // return (
  //   <select
  //     id={id}
  //     multiple={multiple}
  //     className="form-control"
  //     value={typeof value === "undefined" ? emptyValue : value}
  //     required={required}
  //     disabled={disabled || readonly}
  //     autoFocus={autofocus}
  //     onBlur={
  //       onBlur &&
  //       (event => {
  //         const newValue = getValue(event, multiple);
  //         onBlur(id, processValue(schema, newValue));
  //       })
  //     }
  //     onFocus={
  //       onFocus &&
  //       (event => {
  //         const newValue = getValue(event, multiple);
  //         onFocus(id, processValue(schema, newValue));
  //       })
  //     }
  //     onChange={event => {
  //       const newValue = getValue(event, multiple);
  //       onChange(processValue(schema, newValue));
  //     }}
  //   >
  //     {!multiple && schema.default === undefined && (
  //       <option value="">{placeholder}</option>
  //     )}
  //     {enumOptions.map(({ value, label }, i) => {
  //       const disabled = enumDisabled && enumDisabled.indexOf(value) != -1;
  //       return (
  //         <option key={i} value={value} disabled={disabled}>
  //           {label}
  //         </option>
  //       );
  //     })}
  //   </select>
  // );
}

export default SelectWidget;

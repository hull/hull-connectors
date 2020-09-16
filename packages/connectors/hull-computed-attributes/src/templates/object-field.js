/* eslint-disable react/no-multi-comp */
import React from "react";
import { utils } from "@rjsf/core";
import IconButton from "@rjsf/core/lib/components/IconButton";
const { getUiOptions } = utils;

export function canExpand(schema, uiSchema, formData) {
  if (!schema.additionalProperties) {
    return false;
  }
  const { expandable } = getUiOptions(uiSchema);
  if (expandable === false) {
    return expandable;
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
}

export default function ObjectFieldTemplate(props: any) {
  const { TitleField, DescriptionField } = props;
  return (
    <div id={props.idSchema.$id} className="field_object_row">
      {(props.uiSchema["ui:title"] || props.title) && (
        <TitleField
          id={`${props.idSchema.$id}__title`}
          title={props.title || props.uiSchema["ui:title"]}
          required={props.required}
          formContext={props.formContext}
        />
      )}
      {props.description && (
        <DescriptionField
          id={`${props.idSchema.$id}__description`}
          description={props.description}
          formContext={props.formContext}
        />
      )}
      {props.properties.map(prop => prop.content)}
      {canExpand(props.schema, props.uiSchema, props.formData) && (
        <IconButton
          type="info"
          icon="plus"
          className="btn-add btn-secondary btn-sm col-xs-12"
          aria-label="Add"
          tabIndex="0"
          onClick={props.onAddClick(props.schema)}
          disabled={props.disabled || props.readonly}
        />
      )}
    </div>
  );
}

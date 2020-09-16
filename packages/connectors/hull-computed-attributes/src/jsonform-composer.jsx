// @flow

import React, { Component } from "react";
import Form from "@rjsf/core";
import type { EngineState } from "hull-vm";

import transformErrors from "./lib/transform-errors";
import ObjectFieldTemplate from "./templates/object-field";
import ArrayFieldTemplate from "./templates/array-field";
import attributeField from "./fields/attribute";

type Props = {
  computing: boolean,
  schema: {},
  className: string,
  formData: {},
  formContext: {},
  uiSchema: {},
  extraErrors: {},
  readOnly: boolean,
  attributeSchema: [],
  onChange: any => void,
  getPreview: string => string
};

type State = EngineState;

export default class JSONFormComposer extends Component<Props, State> {
  getCustomFields = () => {
    const { attributeSchema } = this.props;
    return {
      SourceAttributeField: attributeField(attributeSchema)
      // TargetAttributeField:
    };
  };

  render() {
    const {
      // computing,
      extraErrors,
      schema,
      uiSchema,
      formContext,
      formData,
      onChange,
      className
    } = this.props;
    return (
      <Form
        className={className}
        onChange={onChange}
        uiSchema={uiSchema}
        formData={formData}
        formContext={formContext}
        schema={schema}
        extraErrors={extraErrors}
        showErrorList={false}
        noHtml5Validate={true}
        transformErrors={transformErrors}
        ObjectFieldTemplate={ObjectFieldTemplate}
        ArrayFieldTemplate={ArrayFieldTemplate}
        liveValidate={true}
        fields={this.getCustomFields()}
      >
        <div></div>
      </Form>
    );
  }
}

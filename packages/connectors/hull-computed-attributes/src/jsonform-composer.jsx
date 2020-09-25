// @flow

import React, { Component } from "react";
import Form from "@rjsf/core";
import type { EngineState } from "hull-vm";

import SelectWidget from "./widgets/select";

import transformErrors from "./lib/transform-errors";
import ObjectFieldTemplate from "./templates/object-field";
import ArrayFieldTemplate from "./templates/array-field";
import AttributeField from "./fields/attribute";

type Props = {
  computing: boolean,
  schema: {},
  className: string,
  formData: {},
  formContext: {},
  uiSchema: {},
  extraErrors: {},
  readOnly: boolean,
  onChange: any => void,
  getPreview: string => string
};

type State = EngineState;

export default class JSONFormComposer extends Component<Props, State> {
  getCustomFields = () => ({ AttributeField });

  getCustomWidgets = () => ({
    SelectWidget
  });

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
        widgets={this.getCustomWidgets()}
        fields={this.getCustomFields()}
      >
        <div></div>
      </Form>
    );
  }
}

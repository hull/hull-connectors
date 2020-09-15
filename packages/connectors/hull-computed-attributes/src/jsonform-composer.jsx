// @flow

import _ from "lodash";
import React, { Component } from "react";
import Form from "@rjsf/core";
import ObjectFieldTemplate from "./lib/object-field-template";
import ArrayFieldTemplate from "./lib/array-field-template";

import attributeField from "./fields/attribute";

type Props = {
  computing: boolean,
  schema: {},
  className: string,
  data: {},
  uiSchema: {},
  extraErrors: {},
  readOnly: boolean,
  attributeSchema: [],
  onChange: any => void
};

type State = EngineState;

const transformErrors = (
  errors: Array<{ message: string, schemaPath: string, name: string }>
) =>
  _.compact(
    errors.map(error => {
      console.log(error);
      if (
        error.name === "pattern" &&
        (error.schemaPath === "#/items/properties/target/pattern" ||
          error.schemaPath === "#/items/required")
      ) {
        return {
          ...error,
          message:
            "This needs to be a valid Attribute Name. Only letters, numbers, / _ and - are allowed"
        };
      }

      if (error.name === "required") {
        if (error.schemaPath === "#/items/required") {
          return {
            ...error,
            message: "You need to define a value here"
          };
        }
        if (error.params?.missingProperty === "value") {
          return {
            ...error,
            message: "Enter a default value"
          };
        }
        if (error.params?.missingProperty === "property") {
          return {
            ...error,
            message: "Pick an Attribute to lookup"
          };
        }
      }

      if (error.name === "anyOf") {
        return undefined;
      }

      return error;
    })
  );

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
      data,
      onChange,
      className
    } = this.props;
    return (
      <Form
        className={className}
        onChange={onChange}
        uiSchema={uiSchema}
        formData={data}
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

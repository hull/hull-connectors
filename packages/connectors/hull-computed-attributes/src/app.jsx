// @flow

import React, { Fragment } from "react";
import { /* CodeTitle,  */ JsonataUI } from "hull-vm/src/ui";
import Form from "./components/jsonform-composer";

import _ from "lodash";

import computedAttributesSchema from "./schemas/computed-attributes.json";
import computedAttributesUiSchema from "./schemas/computed-attributes-ui";

type FormData = { formData: {} };

export default class ComputedAttributesUI extends JsonataUI {
  onComputedAttributeUpdate = ({ formData }: FormData) => {
    const { engine } = this.props;
    engine.updateComputedAttributes(formData);
  };

  onLocalsUpdate = ({ formData }: FormData) => {
    const { engine } = this.props;
    engine.updateLocals(formData);
  };

  getErrors() {
    return {};
  }

  getArraySchema = () => {
    const { current } = this.state;
    const { schema = [] } = current?.result || {};
    return [
      {
        label: "Computed Attributes",
        options: _.filter(schema, { type: "array" })
      },
      {
        label: "Segments",
        options: [
          { label: "User Segments", key: "segments" },
          { label: "Account Segments", key: "account_segments" }
        ]
      }
    ];
  };

  getAttributeSchema = () => {
    const { userAttributeSchema, current, accountAttributeSchema } = this.state;
    const { schema = [] } = current?.result || {};
    return [
      {
        label: "Computed Attributes",
        options: schema
      },
      {
        label: "User Attributes",
        options: userAttributeSchema
      },
      {
        label: "Account Attributes",
        options: accountAttributeSchema
      }
    ];
  };

  renderComposer = () => {
    const { computing, editable, computedAttributes } = this.state;
    return (
      <Fragment>
        <Form
          className="computed_attributes_form"
          schema={computedAttributesSchema}
          uiSchema={computedAttributesUiSchema}
          computing={computing}
          formData={computedAttributes}
          formContext={{
            current: this.state.current,
            getArraySchema: this.getArraySchema,
            getAttributeSchema: this.getAttributeSchema
          }}
          extraErrors={this.getErrors()}
          editable={!editable}
          onChange={this.onComputedAttributeUpdate}
        />
      </Fragment>
    );
  };
}

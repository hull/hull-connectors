// @flow

import React, { Fragment } from "react";
import { CodeTitle, JsonataUI } from "hull-vm/src/ui";
import Form from "./jsonform-composer";

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

  getAttributeSchema = () => {
    const {
      computedAttributes = [],
      userAttributeSchema,
      accountAttributeSchema
    } = this.state;
    return [
      {
        label: "Computed Attributes",
        options: computedAttributes.map(({ target }) => ({
          key: `user.${target}`
        }))
      },
      {
        label: "Segments",
        key: "segments"
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
        <CodeTitle title={<span>Computed Attributes</span>} />
        <Form
          className="computed_attributes_form"
          attributeSchema={this.getAttributeSchema()}
          schema={computedAttributesSchema}
          uiSchema={computedAttributesUiSchema}
          computing={computing}
          formData={computedAttributes}
          formContext={{ current: this.state.current }}
          extraErrors={this.getErrors()}
          editable={!editable}
          onChange={this.onComputedAttributeUpdate}
        />
      </Fragment>
    );
  };
}

// @flow

import React, { Fragment } from "react";
import { CodeTitle, JsonataUI } from "hull-vm/src/ui";
import Form from "./jsonform-composer";

import localsSchema from "./schemas/locals.json";
import localsUiSchema from "./schemas/locals-ui.js";
import fallbacksSchema from "./schemas/fallbacks.json";
import fallbacksUiSchema from "./schemas/fallbacks-ui.js";

type FormData = { formData: {} };

export default class ComputedAttributesUI extends JsonataUI {
  onFallbackUpdate = ({ formData }: FormData) => {
    const { engine } = this.props;
    engine.updateFallbacks(formData);
  };

  onLocalsUpdate = ({ formData }: FormData) => {
    const { engine } = this.props;
    engine.updateLocals(formData);
  };

  getLocalsErrors() {
    // const { locals } = this.state;
    return {
      target: {
        __errors: ["Can't be empty"]
      }
    };
  }

  getFallbacksErrors() {
    return {};
  }

  getAttributeSchema = () => {
    const {
      locals = [],
      userAttributeSchema,
      accountAttributeSchema
    } = this.state;
    return [
      {
        label: "Variables",
        options: locals.map(({ target, source }) => ({
          key: target
        }))
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
    const { computing, editable, fallbacks, locals } = this.state;
    return (
      <Fragment>
        <CodeTitle title={<span>Intermediate Variables</span>} />
        <Form
          className="locals_form"
          attributeSchema={this.getAttributeSchema()}
          schema={localsSchema}
          computing={computing}
          uiSchema={localsUiSchema}
          formData={locals}
          formContext={{ current: this.state.current }}
          editable={!editable}
          extraErrors={this.getLocalsErrors()}
          onChange={this.onLocalsUpdate}
        />
        <CodeTitle title={<span>Computed Attributes</span>} />
        <Form
          className="fallbacks_form"
          attributeSchema={this.getAttributeSchema()}
          schema={fallbacksSchema}
          uiSchema={fallbacksUiSchema}
          computing={computing}
          formData={fallbacks}
          formContext={{ current: this.state.current }}
          extraErrors={this.getFallbacksErrors()}
          editable={!editable}
          onChange={this.onFallbackUpdate}
        />
      </Fragment>
    );
  };
}

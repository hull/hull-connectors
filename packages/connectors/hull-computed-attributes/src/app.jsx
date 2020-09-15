// @flow

import React, { Fragment } from "react";
import { CodeTitle, JsonataUI } from "hull-vm/src/ui";
import Form from "./jsonform-composer";
import localsSchema from "./schemas/locals.json";
import localsUiSchema from "./schemas/locals-ui.json";
import fallbacksSchema from "./schemas/fallbacks.json";
import fallbacksUiSchema from "./schemas/fallbacks-ui.json";

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

  getAttributeSchema() {
    return [
      {
        label: "Attributes",
        options: this.state.attributeSchema
      },
      {
        label: "Variables",
        options: (this.state.locals || []).map(({ target, source }) => ({
          key: target
        }))
      }
    ];
  }

  renderComposer() {
    const { computing, editable, fallbacks, locals } = this.state;
    return (
      <Fragment>
        <CodeTitle title={<span>Intermediate Variables</span>} />
        <Form
          className="locals_form"
          attributeSchema={this.getAttributeSchema()}
          schema={localsSchema}
          uiSchema={localsUiSchema}
          computing={computing}
          data={locals}
          readOnly={!editable}
          extraErrors={this.getLocalsErrors()}
          onChange={this.onLocalsUpdate}
        />
        <CodeTitle title={<span>Computed Attribute Logic (JSON)</span>} />
        <Form
          className="fallbacks_form"
          attributeSchema={this.getAttributeSchema()}
          schema={fallbacksSchema}
          uiSchema={fallbacksUiSchema}
          computing={computing}
          data={fallbacks}
          extraErrors={this.getFallbacksErrors()}
          readOnly={!editable}
          onChange={this.onFallbackUpdate}
        />
      </Fragment>
    );
  }
}

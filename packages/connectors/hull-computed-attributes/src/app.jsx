// @flow

import React from "react";
import { JsonataUI } from "hull-vm/src/ui";
import Form from "./jsonform-composer";

export default class ComputedAttributesUI extends JsonataUI {
  onFormUpdate = ({ formData }) => {
    this.handleFallbacksUpdate(formData);
  };

  handleFallbacksUpdate = (fallbacks: string) => {
    const { engine } = this.props;
    engine.updateFallbacks(fallbacks);
  };

  renderComposer() {
    const { computing, editable, fallbacks } = this.state;
    return (
      <Form
        computing={computing}
        fallbacks={fallbacks}
        readOnly={!editable}
        onChange={this.onFormUpdate}
      />
    );
  }
}

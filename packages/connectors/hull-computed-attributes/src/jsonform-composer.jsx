// @flow

import React, { Component } from "react";
import Form from "@rjsf/core";
import ObjectFieldTemplate from "./lib/object-field-template";
import ArrayFieldTemplate from "./lib/array-field-template";
import schema from "./schema.json";
import uiSchema from "./ui-schema.json";
// import _ from "lodash";

type Props = {
  computing: boolean,
  fallbacks: {},
  readOnly: boolean,
  onChange: any => void
};

type State = EngineState;

export default class JSONFormComposer extends Component<Props, State> {
  render() {
    const { fallbacks, onChange } = this.props;
    return (
      <div className="json-form ps-2">
        <Form
          onChange={onChange}
          uiSchema={uiSchema}
          formData={fallbacks}
          schema={schema}
          ObjectFieldTemplate={ObjectFieldTemplate}
          ArrayFieldTemplate={ArrayFieldTemplate}
          liveValidate={true}
        >
          <div></div>
        </Form>
      </div>
    );
  }
}

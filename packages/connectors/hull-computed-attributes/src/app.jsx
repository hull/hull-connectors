// @flow

import React, { Fragment } from "react";
import _ from "lodash";
import { Graph } from "react-d3-graph";
import { /* CodeTitle,  */ JsonataUI } from "hull-vm/src/ui";
import Form from "./components/jsonform-composer";

import graphConfig from "./lib/graph-config";
import computedAttributesSchema from "./schemas/computed-attributes.json";
import computedAttributesUiSchema from "./schemas/computed-attributes-ui";

type FormData = { formData: {} };

const filterType = type => schema =>
  type ? _.filter(schema, { type }) : schema;

const NODE_PROPS = {
  cx: 200,
  cy: 0
};
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

  getAttributeSchema = ({ types }) => {
    const { userAttributeSchema, current, accountAttributeSchema } = this.state;
    const { schema = [] } = current?.result || {};
    const filter = filterType(types);
    if (types === "array") {
      return [
        {
          label: "Computed Attributes",
          options: filter(schema)
        },
        {
          label: "Segments",
          options: [
            {
              label: "User Segments",
              key: "segments",
              type: "array"
            },
            {
              label: "Account Segments",
              key: "account_segments",
              type: "array"
            }
          ]
        }
      ];
    }
    return [
      {
        label: "Computed Attributes",
        options: filter(schema)
      },
      {
        label: "User Attributes",
        options: filter(userAttributeSchema)
      },
      {
        label: "Account Attributes",
        options: filter(accountAttributeSchema)
      }
    ];
  };

  getGraph = computedAttributes => {
    const nodes = [];
    const links = [];
    _.map(computedAttributes, ({ computed_attribute, params }) => {
      const { attribute, attributes = [] } = params;
      const dependencies = [attribute, ...attributes];
      dependencies.map(id => {
        links.push({ target: computed_attribute, source: id });
        nodes.push({ ...NODE_PROPS, id, color: undefined });
      });
      nodes.push({
        ...NODE_PROPS,
        id: computed_attribute,
        color: "#2684FF",
        dependencies
      });
    });

    return {
      data: {
        nodes: _.uniqBy(
          _.sortBy(nodes, n => n.dependencies?.length),
          "id"
        ),
        links
      },
      config: graphConfig()
    };
  };

  noop = () => {};

  onClickNode = id => {
    this.handleStartEditing({ id });
  };

  handleStopEditing = ({ id }) => {
    this.setState({ editing: null });
  };

  handleStartEditing = ({ id }) => {
    this.setState({ editing: id });
  };

  renderGraph = ({ data, config }) => {
    return (
      <div
        style={{
          display: "block",
          width: "100%",
          height: "300px"
        }}
      >
        <Graph
          id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
          data={data}
          config={config}
          onClickGraph={this.noop}
          onClickNode={this.onClickNode}
          onDoubleClickNode={this.noop}
          onRightClickNode={this.noop}
          onClickLink={this.noop}
          onRightClickLink={this.noop}
          onMouseOverNode={this.noop}
          onMouseOutNode={this.noop}
          onMouseOverLink={this.noop}
          onMouseOutLink={this.noop}
        />
      </div>
    );
  };

  renderComposer = () => {
    const { computing, editable, computedAttributes } = this.state;
    return (
      <Fragment>
        {this.renderGraph(this.getGraph(computedAttributes))};
        <Form
          className="computed_attributes_form"
          schema={computedAttributesSchema}
          uiSchema={computedAttributesUiSchema}
          computing={computing}
          formData={computedAttributes}
          formContext={{
            editing: this.state.editing,
            onStopEditing: this.handleStopEditing,
            onStartEditing: this.handleStartEditing,
            current: this.state.current,
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

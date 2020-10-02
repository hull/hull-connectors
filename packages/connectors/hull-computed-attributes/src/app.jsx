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
  color: "#2684FF"
};
const LINK_PROPS = {
  color: "#2684FF"
};
const OBJECT_LINK_PROPS = {
  color: "#999"
};
export default class ComputedAttributesUI extends JsonataUI {
  onComputedAttributeUpdate = ({ formData }: FormData) => {
    const { engine } = this.props;
    console.log("UPDATING");
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

  addNode = ({ nodes, links, dependencies, target, linkProps, nodeProps }) => {
    dependencies.map(property => {
      if (!property) {
        return;
      }
      links.push({ ...linkProps, target, source: property });
      const path = _.toPath(property);
      if (path.length > 1) {
        this.addNode({
          nodes,
          links,
          dependencies: [_.dropRight(path).join(".")],
          target: path.join("."),
          linkProps: { ...LINK_PROPS, ...OBJECT_LINK_PROPS },
          nodeProps: { ...NODE_PROPS, color: "#4c545e" }
        });
      }
      const nodeTarget = nodes[property] || { id: property };
      nodes[property] = {
        ...nodeProps,
        ...nodeTarget,
        color: this.getNodeColor(property),
        value: this.getValue(property)
      };
      console.log("Adding Node in Loop from", nodes[property]);
    });
    const nodeTarget = nodes[target] || { id: target };
    nodes[target] = {
      ...nodeTarget,
      ...nodeProps,
      value: this.getValue(target),
      color: this.getNodeColor(target),
      dependencies: _.uniq([
        ...(nodeTarget?.dependencies || []),
        ...dependencies
      ])
    };
    console.log("Adding Node Outside of loop", nodes[target]);
  };

  getGraph = (computedAttributes, data) => {
    const nodes = {};
    const links = [];

    _.map(computedAttributes, ({ computed_attribute, params }) => {
      if (!computed_attribute) {
        return;
      }
      const { attribute, attributes = [] } = params;
      const dependencies = [attribute, ...attributes];
      this.addNode({
        nodes,
        links,
        dependencies,
        target: computed_attribute,
        linkProps: LINK_PROPS,
        nodeProps: NODE_PROPS
      });
    });
    console.log("COMPUTATION DONE --------------------------");
    return {
      data: {
        nodes: _.sortBy(_.values(nodes), n => n.dependencies?.length),
        links
      },
      config: graphConfig()
    };
  };
  
  getNodeColor = node => {
    if (this.state.current?.result.traits?.[node]) {
      return "#2684FF";
    }
    if (_.has(this.state.current?.result.traits, node)) {
      return "#4f266b";
    }
    if (_.has(this.state.current?.payload, node)) {
      return "#51c725";
    }
    return "#999";
  };

  getValue = key => {
    const data = {
      ...this.state.current?.result.traits,
      ...this.state.current?.payload
    };
    return _.get(data, key);
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

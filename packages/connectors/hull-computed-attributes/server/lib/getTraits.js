// @flow

import _ from "lodash";
import TopologicalSort from "./topological-sort";

type Payload = {
  // eslint-disable-next-line no-use-before-define
  [key: string]: any
};
type PrimitiveAttributeValue = string | number | boolean | null | Payload;
type AttributeValue =
  | PrimitiveAttributeValue
  | Array<PrimitiveAttributeValue>
  | Payload;

type Node = string;
type ReactiveFunction = Payload => AttributeValue;
type ReactiveFunctionDefinition = [ReactiveFunction, Array<Node>];
type ReactiveFunctions = {
  [property: string]: ReactiveFunctionDefinition
};

export default (reactiveFunctions: ReactiveFunctions, payload: Payload) => {
  const nodes = new Map();
  const graph = new TopologicalSort(nodes);
  const getDelayedValue = path => data => _.get(data, path);
  _.map(reactiveFunctions, ([func, deps], attribute) => {
    graph.addNode(attribute, { func });
    _.map(deps, dep => {
      try {
        graph.addNode(dep, { func: getDelayedValue(dep) });
      } catch (err) {
        console.log("Node already exists", { attribute, deps });
        // console.log(err);
      }
      graph.addEdge(attribute, dep);
    });
  });

  const sorted = graph.sort();
  const traits = {};
  sorted.forEach(({ node /* , children */ }, key: string) => {
    const { func } = node;
    traits[key] = func({ ...payload, ...traits });
  });

  console.log(traits);
  return traits;
};

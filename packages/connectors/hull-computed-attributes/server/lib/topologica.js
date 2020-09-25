// @flow

import _ from "lodash";
import flat from "flat";

type Payload = {
  // eslint-disable-next-line no-use-before-define
  [key: string]: AttributeValue
};
type PrimitiveAttributeValue = string | number | boolean | null | Payload;
type AttributeValue =
  | PrimitiveAttributeValue
  | Array<PrimitiveAttributeValue>
  | Payload;

type ReactiveFunctions = {
  [property: string]: [(Payload) => AttributeValue, Array<string>]
};

function customizer(baseValue, value) {
  if (Array.isArray(baseValue) && Array.isArray(value)) {
    return _.isEqual(baseValue.sort(), value.sort());
  }
}

function difference(object, base) {
  function changes(object, base) {
    return _.transform(object, function(result, value, key) {
      if (!_.isEqualWith(value, base[key], customizer)) {
        result[key] =
          _.isObject(value) && _.isObject(base[key])
            ? changes(value, base[key])
            : value;
      }
    });
  }
  return changes(object, base);
}

export default (reactiveFunctions: ReactiveFunctions) => {
  const state: Payload = {};
  const functions = {};
  const edges = {};

  const invoke = property => functions[property]();

  const allDefined = dependencies => {
    const arg = {};
    return dependencies.every(property => {
      const depValue = _.get(state, property);
      if (depValue !== undefined) {
        arg[property] = depValue;
        return true;
      }
      return false;
    })
      ? arg
      : null;
  };

  _.map(reactiveFunctions, (definition, property: string) => {
    const [fn, dependencies] = definition;

    _.map(dependencies, dependency => {
      (edges[dependency] = edges[dependency] || []).push(property);
    });

    functions[property] = () => {
      const arg = allDefined(dependencies);
      if (arg) {
        _.set(state, property, fn(arg));
      }
    };
  });

  const depthFirstSearch = (sourceNodes: Array<string>) => {
    const visited = {};
    const nodeList = [];

    const search = (node: string) => {
      if (!_.get(visited, node)) {
        // eslint-disable-next-line no-use-before-define
        visit(node);
        nodeList.push(node);
      }
    };

    const visit = (node: string) => {
      _.set(visited, node, true);
      const nodes = _.get(edges, node);
      if (nodes) {
        _.map(nodes, search);
      }
    };

    _.map(sourceNodes, visit);

    return nodeList;
  };

  const definedProperties = _.keys(reactiveFunctions);

  const set = function onSet(stateChange: Payload) {
    // Build a map of all changed Properties by deep-comparing states
    const changedProperties = _.compact(
      _.map(flat(stateChange), (value, key: string) => {
        const prevValue: AttributeValue = _.get(state, key);
        if (prevValue !== value) {
          // Update state with newValue data if it changed
          _.set(state, key, value);
          // And return the changed key
          return key;
        }
        return undefined;
      })
    );

    depthFirstSearch(changedProperties)
      .reverse()
      .forEach(invoke);
    return this;
  };

  return {
    set,
    get: () => state,
    getComputed: () => _.pick(state, definedProperties)
  };
};

/* @flow */
const _ = require("lodash");

const { isUndefinedOrNull } = require("./utils");

function notNull(param: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return !isUndefinedOrNull(contextVariable);
  };
}

function isNull(param: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return isUndefinedOrNull(contextVariable);
  };
}

function isServiceAttribute(attributeListParam: string, param: string) {
  return (context) => {
    const attributeList = context.get(attributeListParam);
    const contextVariable = context.get(param);
    return _.filter(attributeList, { service: contextVariable }).length > 0;
  };
}

function not(method) {
  return (context, input) => {
    return !method(context, input);
  }
}

function doesContain(listValues, param: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return listValues.indexOf(contextVariable) > -1;
  };
}

function doesNotContain(listValues, param: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return listValues.indexOf(contextVariable) < 0;
  };
}

function isEqual(param: string, value) {
  return (context) => {
    const contextVariable = context.get(param);
    return contextVariable === value;
  };
}

function isNotEqual(param: string, value) {
  return (context) => {
    const contextVariable = context.get(param);
    return contextVariable !== value;
  };
}

function inputIsNotEqual(param: string, value) {
  return (context, input) => {
    const contextVariable = _.get(input, param);
    return contextVariable !== value;
  };
}

function inputIsEqual(param: string, value) {
  return (context, input) => {
    const contextVariable = _.get(input, param);
    return contextVariable === value;
  };
}

module.exports = {
  notNull,
  isNull,
  isNotEqual,
  isEqual,
  doesNotContain,
  doesContain,
  inputIsNotEqual,
  inputIsEqual,
  isServiceAttribute,
  not
};

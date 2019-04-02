/* @flow */
const _ = require("lodash");

const { isUndefinedOrNull } = require("./utils");

function notNull(param: string) {
  return (context) => {
    const contextVariable = _.get(context, param);
    return !isUndefinedOrNull(contextVariable);
  };
}

function isNull(param: string) {
  return (context) => {
    const contextVariable = _.get(context, param);
    return isUndefinedOrNull(contextVariable);
  };
}

function doesNotContain(listValues, param: string) {
  return (context) => {
    const contextVariable = _.get(context, param);
    return listValues.indexOf(contextVariable) < 0;
  };
}

function isEqual(param: string, value) {
  return (context) => {
    const contextVariable = _.get(context, param);
    return contextVariable === value;
  };
}

function isNotEqual(param: string, value) {
  return (context) => {
    const contextVariable = _.get(context, param);
    return contextVariable !== value;
  };
}

function isNotEmpty(param: string) {
  return (context) => {
    const contextVariable = _.get(context, param);
    return notNull(contextVariable) && contextVariable !== "";
  };
}

function isEmptyNotNull(param: string) {
  return (context) => {
    const contextVariable = _.get(context, param);
    return notNull(contextVariable) && contextVariable === "";
  };
}

module.exports = {
  notNull,
  isNull,
  isNotEqual,
  isEqual,
  doesNotContain,
  isEmptyNotNull,
  isNotEmpty
};

/* @flow */
const _ = require("lodash");

const { isUndefinedOrNull } = require("./utils");

/*** Trying to enforce some standards here with this simple convention.... probably won't hold, but better than wild wet ***/
function not(method) {
  return (context, input) => {
    return !method(context, input);
  }
}

function or(...conditions) {
  return (context, input) => {
    return _.some(conditions, method => {
      return method(context, input);
    });
  }
}

function varUndefined(param: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return contextVariable === undefined;
  };
}

function varNull(param: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return contextVariable === null;
  };
}

function varUndefinedOrNull(param: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return isUndefinedOrNull(contextVariable);
  };
}

function varEqual(param: string, object: any) {
  return (context) => {
    const contextVariable = context.get(param);
    return _.isEqual(contextVariable, object)
  };
}

function varEqualVar(param: string, param2: any) {
  return (context) => {
    const contextVariable = context.get(param);
    const contextVariable2 = context.get(param2);
    return _.isEqual(contextVariable, contextVariable2)
  };
}

function varInArray(param: string, listValues) {
  return (context) => {
    const contextVariable = context.get(param);
    return listValues.indexOf(contextVariable) > -1;
  };
}

function isServiceAttributeInVarList(serviceName: string, varListName: string) {
  return (context) => {
    const list = context.get(`connector.private_settings.${varListName}`);
    return _.filter(list, { service: serviceName }).length > 0;
  };
}

function isVarServiceAttributeInVarList(varServiceName: string, varListName: string) {
  return (context) => {
    const serviceName = context.get(varServiceName);
    const list = context.get(`connector.private_settings.${varListName}`);
    return _.filter(list, { service: serviceName }).length > 0;
  };
}

function varStartsWithString(param: string, stringStart: string) {
  return (context) => {
    const contextVariable = context.get(param);
    return contextVariable.startsWith(stringStart);
  }
}

/***************************/

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

function isServiceAttribute(attributeListParam: string, param: string) {
  return (context) => {
    const attributeList = context.get(attributeListParam);
    const contextVariable = context.get(param);
    return _.filter(attributeList, { service: contextVariable }).length > 0;
  };
}

function mappingExists(attributeListParam: string, truthy: Object) {
  return (context) => {
    const attributeList = context.get(`connector.private_settings.${attributeListParam}`);
    return _.filter(attributeList, truthy).length > 0;
  };
}


function resolveIndexOf(listName, paramName) {
  return (context) => {
    const param = context.get(paramName);
    const list = context.get(listName);
    return _.indexOf(list, param) >= 0;
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

function inputIsEmpty(param: string) {
  return (context, input) => {
    const contextVariable = _.get(input, param);
    return _.isEmpty(contextVariable);
  };
}

function inputIsNotEmpty(param: string) {
  return (context, input) => {
    const contextVariable = _.get(input, param);
    return !_.isEmpty(contextVariable);
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
  inputIsNotEmpty,
  inputIsEmpty,
  isServiceAttribute,
  not,
  mappingExists,
  resolveIndexOf,
  varUndefined,
  varNull,
  varUndefinedOrNull,
  varEqual,
  varEqualVar,
  varInArray,
  isServiceAttributeInVarList,
  isVarServiceAttributeInVarList,
  or,
  varStartsWithString
};

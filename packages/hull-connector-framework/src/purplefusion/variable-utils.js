/* @flow */

const _ = require("lodash");
const { HullInstruction } = require("./language");
const HullVariableContext = require("./variable-context");

const debug = require("debug")("hull-shared:variable-utils");
/**
 *
 * TODO Still have to figure out how to recurse...
 */
function cloneObjectWithVariablesReplaced(context: HullVariableContext, obj: Object) {
  if (_.isArray(obj)) {
    return obj.map(value => {
      return cloneObjectWithVariablesReplaced(context, value);
    });
  } else if (_.isObject(obj)) {
    const returnObj = {};

    _.forEach(obj, (value, key) => {

      let k = key;
      if (typeof key === 'string') {
        k = doStringVariableReplacement(context, key);
      }

      returnObj[k] = cloneObjectWithVariablesReplaced(context, value);
    });

    return returnObj;
  } else if (typeof obj === 'string') {
    return doStringVariableReplacement(context, obj);
  } else {
    return obj;
  }
}



function hasVariables(obj) {

  //don't replace any variables in hull instruction
  //those are meant to be handled explicitly...
  // I may regret putting this in here, could cause some bugs...
  if (obj instanceof HullInstruction) {
    return false;
  } else if (_.isArray(obj)) {
    return _.some(obj, (value) => {
      return hasVariables(value);
    });
  } else if (_.isObject(obj)) {
    return _.some(obj, (value, key) => {

      if (typeof key === 'string' && key.indexOf("${") >= 0) {
        return true;
      }
      return hasVariables(value);

    });
  } else if (typeof obj === 'string'){
    return obj.indexOf("${") >= 0;
  } else {
    return false;
  }

};

function doStringVariableReplacement(context: HullVariableContext, value: string): string {
  const resolvedValue = [];
  let closeIndex = 0;
  let variableIndex = value.indexOf("${");

  if (variableIndex < 0)
    return value;

  while (variableIndex >= 0) {
    if (closeIndex !== variableIndex) {
      resolvedValue.push(value.substring(closeIndex, variableIndex));
    }
    closeIndex = value.indexOf("}", variableIndex);
    const variableName = value.substring(variableIndex + 2, closeIndex);

    // we are now using Hull Variable Context which has the notion of scopes
    // it helps performance so that we don't have to copy the context everywhere
    //let variableValue = _.get(context, variableName);
    let variableValue = context.get(variableName);

    if (variableValue === undefined || variableValue === null) {
      // TODO a null value might be OK...
      // bug undefined should maybe throw an error
      debug(`Couldn't find variable in context: ${variableName}`);
      // don't need to push an empty string because join removes undefined/null when joining with ""
    }
    resolvedValue.push(variableValue);
    closeIndex += 1;
    variableIndex = value.indexOf("${", closeIndex);
  }

  if (closeIndex !== value.length) {
    resolvedValue.push(value.substring(closeIndex, value.length));
  }

  if (resolvedValue.length === 1) {
    // this ensures that if the value in the context was a number, we don't turn it into a string
    return resolvedValue[0];
  }
  return resolvedValue.join("");
}

/**
 * yes, if there aren't any variables we return the same object
 * but in all other cases we create a new object, no data mutation
 */
function doVariableReplacement(context: HullVariableContext, value: any): any {
  if (value === undefined || value === null)
    return value;

  // underlying logic will do this too
  // but if we know we have a string upfront, we can avoid a more costly hasVariables traversal
  // which we call so that if there's no variables, we don't have to create a new obj
  // but hasVariables for string is a quick lookup, doesn't seem costly to me...
  if (typeof value === 'string') {
    return doStringVariableReplacement(context, value);
  } else if (hasVariables(value)) {
    return cloneObjectWithVariablesReplaced(context, value);
  } else {
    return value;
  }
}


module.exports = {
  doVariableReplacement,
  doStringVariableReplacement,
  hasVariables
};

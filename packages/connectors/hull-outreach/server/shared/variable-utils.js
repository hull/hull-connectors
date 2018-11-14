/* @flow */

const _ = require("lodash");
const { HullInstruction } = require("./language");
const debug = require("debug")("hull-shared:variable-utils");
/**
 *
 * TODO Still have to figure out how to recurse...
 */
function cloneObjectWithVariablesReplaced(context: Object, obj: Object) {

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

function doStringVariableReplacement(context: Object, value: string): string {
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
    let variableValue = _.get(context, variableName);

    if (variableValue === undefined || variableValue === null) {
      debug(`Couldn't find variable in context: ${variableName}`);
      // don't need to push an empty string because join removes undefined/null when joining with ""
    }
    resolvedValue.push(variableValue);
    closeIndex += 1;
    variableIndex = value.indexOf(value, closeIndex);
  }

  resolvedValue.push(value.substring(closeIndex, value.length));

  return resolvedValue.join("");
}

/**
 * yes, if there aren't any variables we return the same object
 * but in all other cases we create a new object, no data mutation
 */
function doVariableReplacement(context: Object, value: any): any {
  if (value === undefined || value === null)
    return value;

  // underlying logic will do this too
  // but if we know we have a string upfront, we can avoid a more costly hasVariables traversal
  // which we call so that if there's no variables, we don't have to create a new obj
  if (typeof value === 'string') {
    return doStringVariableReplacement(context, value);
  } else if (hasVariables(value)) {
    return cloneObjectWithVariablesReplaced(context, value);
  } else {
    return value;
  }
}


module.exports = {
  doVariableReplacement
};

/* @flow */

const _ = require("lodash");

/**
 *
 * TODO Still have to figure out how to recurse...
 */
function cloneObjectWithVariablesReplaced(context: Object, obj: Object) {

  if (!hasVariables(obj))
    return obj;

    if (Array.isArray(obj)) {
      return obj.map(value => {
        if (typeof value === 'string') {
          return doStringVariableReplacement(context, value);
        } else {
          return value;
        }
      });
    } else {
      const returnObj = {};
      _.forEach(obj, (value, key) => {

        let v = value;
        if (typeof value === 'string') {
          v = doStringVariableReplacement(context, value);
        }

        let k = key;
        if (typeof key === 'string') {
          k = doStringVariableReplacement(context, key);
        }

        returnObj[k] = v;

      });
      return returnObj;
    }


}

function hasVariables(obj: Object) {

  let found = false;

  _.forEach(obj, (value, key) => {
    if (typeof value === 'string' && value.indexOf("${") >= 0) {
      found = true;
    } else if (typeof key === 'string' && value.indexOf("${") >= 0) {
      found = true;
    }
  });

  return found;
}

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
    const variableValue = _.get(context, variableName);

    if (variableValue === undefined || variableValue === null) {
      console.log("Bad! Couldn't find: " + variableName);
    }
    resolvedValue.push(variableValue);
    closeIndex += 1;
    variableIndex = value.indexOf(value, closeIndex);
  }

  resolvedValue.push(value.substring(closeIndex, value.length));

  return resolvedValue.join("");
}

function doVariableReplacement(context: Object, value: any): any {
  if (value === undefined || value === null)
    return value;

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

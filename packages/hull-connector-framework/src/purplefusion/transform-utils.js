/* @flow */
const _ = require("lodash");

function toUnixTimestamp() {
  return (date) => {
    const closeDate = new Date(date);
    return closeDate.getTime();
  }
}

function evaluateCondition(conditions, context, input): boolean {
  let conditionArray = [];
  if (!Array.isArray(conditions)) {
    conditionArray.push(conditions);
  } else {
    conditionArray = conditions;
  }
  for (let i = 0; i < conditionArray.length; i += 1) {
    const condition = conditionArray[i];
    if (typeof condition === 'string') {
      const value = context.get(condition);

      if (isUndefinedOrNull(value)) {
        return false
      } else if (typeof value === 'boolean' && !value) {
        return false;
      }
    } else if (typeof condition === 'function') {
      if (!condition(context, input)) {
        return false;
      }
    }
  }
  return true;
}

function evaluateValidation(transform, context, input) {
  if (transform.validation) {
    if (evaluateCondition(transform.validation.condition, context, input)) {
      if (transform.validation.error === "BreakProcess") {
        throw new Error(`Validation didn't pass for transform: ${transform.validation.message}\n ${JSON.stringify(transform, null, 2)}\n input: ${JSON.stringify(input, null, 2)}`);
      } else if (transform.validation.error === "Skip") {
        throw new SkippableError(`Validation didn't pass for transform: ${transform.validation.message} ${JSON.stringify(transform, null, 2)}`);
      }
    }
    //evaluate transforma.validation.condition
    //if true
    // look at transform.validation.error
    //if error === "breakeverything"
  }
}

function toTransform(transform, context, input) {
  if (!_.isPlainObject(transform) || !transform.condition) {
    evaluateValidation(transform, context, input);
    return true;
  }

  if (evaluateCondition(transform.condition, context, input)) {
    evaluateValidation(transform, context, input);
    return true;
  }
  return false;
}

module.exports = {
  toUnixTimestamp,
  toTransform
};

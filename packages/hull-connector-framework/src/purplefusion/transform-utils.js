/* @flow */
const _ = require("lodash");

const { isUndefinedOrNull, asyncForEach } = require("./utils");
const { Route } = require("./language");
const { SkippableError, ValidationError } = require("hull/src/errors");


function toUnixTimestamp() {
  return (date) => {
    const closeDate = new Date(date);
    return closeDate.getTime();
  }
}

function evaluateCondition(transform, context, input): boolean {
  if (!_.isPlainObject(transform) || !transform.condition) {
    return true;
  }
  const conditions = transform.condition;
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
    if (evaluateCondition(transform.validation, context, input)) {
      if (transform.validation.error === "BreakProcess") {
        throw new Error(`Validation didn't pass for transform: ${transform.validation.message}\n ${JSON.stringify(transform, null, 2)}\n input: ${JSON.stringify(input, null, 2)}`);
      } else if (transform.validation.error === "Skip") {
        throw new SkippableError(`Validation didn't pass for transform: ${transform.validation.message} ${JSON.stringify(transform, null, 2)}`);
      } else if (transform.validation.error === "BreakToLoop") {
        throw new ValidationError(`Validation didn't pass for transform: ${transform.validation.message} ${JSON.stringify(transform, null, 2)}`, "BreakToLoop", 200);
      }
    }
  }
}

function toTransform(transform, context, input) {
  evaluateValidation(transform, context, input);
  return evaluateCondition(transform, context, input);
}

module.exports = {
  toUnixTimestamp,
  toTransform
};

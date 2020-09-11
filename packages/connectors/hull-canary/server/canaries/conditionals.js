const _ = require("lodash");

function changedValueIsNew(changeValues) {
  if (!_.isEmpty(changeValues)) {
    if (
      changeValues.length === 2 &&
      changeValues[0] === null &&
      !_.isEmpty(changeValues[1])
    ) {
      return true;
    }
  }
  return false;
}

function isNullOrUndefined(value) {
  return value === undefined || value === null;
}

function endsWith(ending) {
  const postfix = ending;
  return value => {
    if (!_.isEmpty(value)) {
      return _.endsWith(value, postfix);
    }
    return false;
  };
}

function startsWith(starting) {
  const prefix = starting;
  return value => {
    if (!_.isEmpty(value)) {
      return _.startsWith(value, prefix);
    }
    return false;
  };
}

function not(someCondition) {
  return value => {
    return !someCondition(value);
  };
}

module.exports = {
  not,
  changedValueIsNew,
  isNullOrUndefined,
  endsWith,
  startsWith
};

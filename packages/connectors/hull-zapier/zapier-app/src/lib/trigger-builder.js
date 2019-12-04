const _ = require("lodash");
const { subscribe } = require("./subscribe");
const { unsubscribe } = require("./unsubscribe");

function getSample({ sample }) {
  return async (z, bundle) => {
    return Promise.resolve([sample]);
  };
}

function triggerBuilder({
  getInputFields,
  performTrigger,
  entityType,
  action,
  description,
  sample,
  important = false,
  hidden = false,
}) {
  const titleAction = _.startCase(action);
  const titleNoun = _.startCase(entityType);
  return {
    operation: {
      sample,
      type: "hook",
      performList: getSample({ sample }),
      perform: performTrigger({ entityType, action }),
      performSubscribe: subscribe({ entityType, action }),
      performUnsubscribe: unsubscribe({ entityType, action }),
      inputFields: [getInputFields]
    },
    noun: entityType,
    display: {
      hidden: hidden,
      important,
      description,
      label: `${titleNoun} ${titleAction}`
    },
    key: `${entityType}_${action}`
  };
}

module.exports = {
  triggerBuilder
};

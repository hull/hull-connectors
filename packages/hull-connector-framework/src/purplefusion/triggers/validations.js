const _ = require("lodash");

const validateChanges = (changes, inputData) => {
  // TODO: generate global whitelist from inputData
  return !_.isEmpty(_.intersection(inputData, _.keys(changes)));
};

const validateEvents = (events, inputData) => {
  // TODO: generate global whitelist from inputData

  const eventNames = _.map(events, "event");
  return !_.isEmpty(_.intersection(eventNames, inputData));
};

const validateSegments = (segments, inputData) => {
  // TODO: generate global whitelist from inputData

  const segmentIds = _.concat('all_segments', _.map(segments, 'id'));
  return !_.isEmpty(_.intersection(inputData, segmentIds));
};

const required = (obj, inputData) => {
  return !_.isEmpty(obj);
};

const isValidSubEntity = (entity: Object, rules: Array<Object>, whitelist: Array<string>): Array<string> => {
  let valid = true;

  _.forEach(rules, rule => {

    if (_.isFunction(rule) && !rule(entity, whitelist)) {
      return (valid = false);
    }

    if (!_.isFunction(rule) && _.isObject(rule)) {
      const filter = _.filter([entity], rule);

      if (_.isEmpty(filter)) {
        return (valid = false);
      }
    }

    if (_.isBoolean(rule) || _.isString(rule)) {
      if (whitelist !== rule) {
        return (valid = false);
      }
    }
  });
  return valid;
};

const isValidMessage = (message: Object, validations: Object, whitelist: Array<string>) => {
  let valid = !_.isEmpty(validations);

  _.forEach(_.keys(validations), entityToValidate => {
    const entity = _.get(message, entityToValidate);
    const rawRules = _.get(validations, entityToValidate);

    const rules = !_.isArray(rawRules) ? [rawRules] : rawRules;

    if (!isValidSubEntity(entity, rules, whitelist)) {
      return (valid = false);
    }
  });

  return valid;
};

const isValidTrigger = (triggerDefinitions: Object, message: Object, triggerInputData: Object): boolean => {
  let valid = true;
  _.forEach(_.keys(triggerInputData), action => {

    const whitelist = _.get(triggerInputData, action);
    const triggerDefinition = _.get(triggerDefinitions, action, {});

    const { validations } = triggerDefinition;

    if (!isValidMessage(message, validations, whitelist)) {
      return (valid = false);
    }
  });

  return valid;
};



module.exports = {
  isValidTrigger,
  isValidMessage,
  isValidSubEntity,
  validateChanges,
  validateSegments,
  validateEvents,
  required
};

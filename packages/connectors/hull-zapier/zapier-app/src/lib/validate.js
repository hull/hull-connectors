const _ = require("lodash");

const validateChanges = (entities) => (changes, inputData) => {
  let missingWhitelists =
    _.isEmpty(_.get(inputData, 'user_attributes', [])) &&
    _.isEmpty(_.get(inputData, 'account_attributes', []));

  if (missingWhitelists) {
    return false;
  }

  let i;
  for (i = 0; i < entities.length; i++) {
    const entity = entities[i];

    const entityChanges = _.keys(_.get(changes, entity, {}));
    const attributesWhitelist = _.get(inputData, `${entity}_attributes`, []);
    const isWhitelistedAttr = !_.isEmpty(_.intersection(attributesWhitelist, entityChanges));

    if (isWhitelistedAttr) {
      return isWhitelistedAttr;
    }
  }

  return false;
};

const validateEvents = (events, inputData) => {
  const eventNames = _.map(events, "event");
  const eventWhitelist = _.get(inputData, "user_events", []);

  return !_.isEmpty(_.intersection(eventNames, eventWhitelist));
};

const validateSegments = (entityType) => (segments, inputData) => {
  const segmentIds = _.concat('all_segments', _.map(segments, 'id'));

  const inputDataPath = `${entityType}_segments`;
  const segmentWhitelist = _.get(inputData, inputDataPath, []);

  return !_.isEmpty(_.intersection(segmentWhitelist, segmentIds));
};

const required = (obj, inputData) => {
  return !_.isEmpty(obj);
};

function isValidMessage(message, inputData, validation) {
  const validationKeys = _.keys(validation);
  for(let i = 0; i < validationKeys.length; i++ ) {

    const entity = _.get(message, validationKeys[i]);
    const validationRule = _.get(validation, validationKeys[i]);

    const rules = !_.isArray(validationRule) ? [validationRule] : validationRule;

    for(let j = 0; j < rules.length; j++ ) {
      const rule = rules[j];

      if (_.isFunction(rule) && !rule(entity, inputData)) {
        return false;
      }

      if (!_.isFunction(rule) && _.isObject(rule)) {
        const filter = _.filter([entity], rule);

        if (_.isEmpty(filter)) {
          return false;
        }
      }
    }
  }
  return true;
}

module.exports = {
  validateChanges,
  validateSegments,
  validateEvents,
  required,
  isValidMessage
};

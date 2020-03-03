/* @flow */

const _ = require("lodash");
const {
  HullOutgoingUser,
  HullOutgoingAccount
} = require("../hull-service-objects");
const { setHullDataType } = require("../utils");
const { filterMessage } = require("./filters");
const { isValidTrigger } = require("./validations");
const { triggers } = require("./triggers");

function getCleanedMessage(definedTriggers: Object, message: Object, inputData: Object): Array<string> {

  const standardFilter = _.concat(
    !_.isEmpty(_.get(message, "user", {})) ? [ "user", "segments" ] : [],
    [ "account", "account_segments", "message_id"]
  );
  let filteredEntity = _.pick(message, standardFilter);

  _.forEach(_.keys(inputData), action => {
    const whitelist = _.get(inputData, action);

    if (_.isNil(action) || _.isEmpty(action)) {
      return {};
    }

    const triggerDefinition = _.get(definedTriggers, action, {});

    const { filters } = triggerDefinition;

    const filteredSubEntity = filterMessage(message, filters, whitelist);

    _.reduce(filters, (result, value, key) => {
      _.set(result, key, _.get(filteredSubEntity, key));
      return result;
    }, filteredEntity);
  });

  return filteredEntity;
}

function hasValidTrigger(entity: Object, activeTriggers: Array<Object>): boolean {
  let isValid = false;
  _.forEach(activeTriggers, activeTrigger => {
    if (isValidTrigger(triggers, entity, activeTrigger.inputData)) {
      return (isValid = true);
    }
  });

  return isValid;
}

function getEntityTriggers(entity: Object, activeTriggers: Array<Object>): Array<string> {
  const filteredTriggers = [];

  _.forEach(activeTriggers, activeTrigger => {
    if (isValidTrigger(triggers, entity, activeTrigger.inputData)) {
      const rawEntity = entity;

      const cleanedEntity = getCleanedMessage(triggers, entity, activeTrigger.inputData);

      let entityDataType = null;
      if (!_.isEmpty(_.get(entity, "user"))) {
        entityDataType = HullOutgoingUser;
      }

      if (!_.isEmpty(_.get(entity, "account")) && _.isEmpty(_.get(entity, "user"))) {
        entityDataType = HullOutgoingAccount;
      }

      if (!_.isNil(entityDataType)) {
        setHullDataType(cleanedEntity, entityDataType);

        const serviceAction = activeTrigger.serviceAction;

        filteredTriggers.push({ serviceAction, cleanedEntity, rawEntity });
      }
    }
  });

  return filteredTriggers;
}


module.exports = {
  getEntityTriggers,
  getCleanedMessage,
  hasValidTrigger
};

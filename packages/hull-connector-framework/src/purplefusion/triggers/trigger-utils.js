/* @flow */

const _ = require("lodash");
const {
  HullOutgoingUser,
  HullOutgoingAccount
} = require("../hull-service-objects");
const { setHullDataType } = require("../utils");
const { filterMessage } = require("./filters");
const { isValidTrigger } = require("./validations");
const triggerDefinitions = require("./triggers");

function getCleanedMessage(message: Object, inputData: Object, triggers: Object): Array<string> {

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

    const triggerDefinition = _.get(triggers, action, {});

    const { filters } = triggerDefinition;

    const filteredSubEntity = filterMessage(message, filters, whitelist);

    _.reduce(filters, (result, value, key) => {
      _.set(result, key, _.get(filteredSubEntity, key));
      return result;
    }, filteredEntity);
  });

  return filteredEntity;
}

function getEntityTriggers(context: Object, entity: Object): Array<string> {
  const { triggers } = triggerDefinitions;
  const filteredTriggers = [];

  _.forEach(_.get(context, "connector.private_settings.triggers", []), activeTrigger => {
    if (isValidTrigger(triggers, entity, activeTrigger.inputData)) {
      const rawEntity = entity;

      const cleanedEntity = getCleanedMessage(entity, activeTrigger.inputData, triggers);

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
  getCleanedMessage
};

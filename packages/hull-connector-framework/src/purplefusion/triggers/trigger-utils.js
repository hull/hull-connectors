/* @flow */

const _ = require("lodash");
const { triggers } = require("./triggers");
const {
  HullOutgoingUser,
  HullOutgoingAccount
} = require("../hull-service-objects");
const { setHullDataType } = require("../utils");
const { filter } = require("./filter");
const { isValidTrigger } = require("./validations");

function getEntityTriggers(context: Object, entity: Object): Array<string> {
  const filteredTriggers = [];

  _.forEach(_.get(context, "connector.private_settings.triggers", []), activeTrigger => {
    if (isValidTrigger(triggers, entity, activeTrigger.inputData)) {
      const rawEntity = entity;

      const cleanedEntity = filter(entity, activeTrigger.inputData);

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
  getEntityTriggers
};

// @flow
const _ = require("lodash");
import type {
  HullTrigger,
  HullEvent,
  HullSegment,
  HullTriggerWhitelist,
  HullTriggerDefinitions,
  HullTriggerDefinition,
  HullTriggerValidations,
  HullTriggerValidation,
  HullTriggerValidationFunction,
  HullTriggerValidationRule,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";

// TODO: generate global whitelist from whitelist
const validateChanges: HullTriggerValidationFunction = (
  changes: $PropertyType<
    $PropertyType<HullUserUpdateMessage, "changes">,
    "user"
  >,
  whitelist: Array<string>
): boolean => !_.isEmpty(_.intersection(whitelist, _.keys(changes)));

// TODO: generate global whitelist from whitelist
const validateEvents: HullTriggerValidationFunction = (
  events: Array<HullEvent>,
  whitelist: Array<string>
): boolean => !_.isEmpty(_.intersection(whitelist, _.map(events, "event")));

// TODOANDY -> is this a custom entry? We already use `ALL` as a value everywhere else.
// TODO: generate global whitelist from whitelist
const validateSegments: HullTriggerValidationFunction = (
  segments: Array<HullSegment>,
  whitelist: Array<string>
): boolean =>
  !_.isEmpty(
    _.intersection(whitelist, ["all_segments", ..._.map(segments, "id")])
  );

const required: HullTriggerValidationFunction = (
  obj,
  whitelist: Array<string>
): boolean => !_.isEmpty(obj);

const isValidSubEntity = (
  entity: {},
  rules: Array<HullTriggerValidation>,
  whitelist: HullTriggerWhitelist
): boolean =>
  _.every(rules, rule => {
    // TODOANY: Whitelisst could be a boolean, yet we assume in every validation function that it's an array of string...
    if (typeof rule === "function" && Array.isArray(whitelist)) {
      return rule(entity, whitelist);
    }
    if (typeof rule === "object" && _.isEmpty(_.filter([entity], rule))) {
      return false;
    }
    if (typeof rule === "boolean" || typeof rule === "string") {
      if (whitelist !== rule) {
        return false;
      }
    }
    return true;
  });

const isValidMessage = (
  message: HullUserUpdateMessage | HullAccountUpdateMessage,
  validations: HullTriggerValidations,
  whitelist: HullTriggerWhitelist
): boolean => {
  if (_.isEmpty(validations)) {
    return false;
  }
  return _.every(validations, (rules, key) =>
    isValidSubEntity(
      _.get(message, key),
      _.isArray(rules) ? rules : [rules],
      whitelist
    )
  );
};

const isValidTrigger = (
  triggerDefinitions: HullTriggerDefinitions,
  message: HullUserUpdateMessage | HullAccountUpdateMessage,
  inputData: $PropertyType<HullTrigger, "inputData">
): boolean =>
  _.some(inputData, (whitelist: HullTriggerWhitelist, path: string) => {
    const triggerDefinition: HullTriggerDefinition = _.get(
      triggerDefinitions,
      path,
      {}
    );
    const { validations /* type, filters */ } = triggerDefinition;
    return isValidMessage(message, validations, whitelist);
  });

module.exports = {
  isValidTrigger,
  isValidMessage,
  isValidSubEntity,
  validateChanges,
  validateSegments,
  validateEvents,
  required
};

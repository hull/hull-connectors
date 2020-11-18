// @flow
const _ = require("lodash");
import type {
  HullTrigger,
  HullEvent,
  HullSegment,
  HullTriggerList,
  HullTriggerDefinitions,
  HullTriggerDefinition,
  HullTriggerValidations,
  HullTriggerValidation,
  HullTriggerValidationFunction,
  HullTriggerValidationRule,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";

const getSegmentIds = (segments: Array<HullSegment>) => [
  "ALL",
  "all_segments",
  ..._.map(segments, "id")
];

const getEventNames = (events: Array<HullEvent>) => [
  "ALL",
  "all_events",
  ..._.map(events, "event")
];

const intersectionWithSegment = (
  segments: Array<HullSegment>,
  list: Array<string>
) => _.intersection(getSegmentIds(segments), list);

const intersectionWithEvent = (
  events: Array<HullEvent>,
  list: Array<string>
) => _.intersection(getEventNames(events), list);

const validateChanges: HullTriggerValidationFunction = (
  changes: $PropertyType<
    $PropertyType<HullUserUpdateMessage, "changes">,
    "user"
  >,
  whitelist: Array<string>
): boolean %checks => !_.isEmpty(_.intersection(whitelist, _.keys(changes)));

const validateEvents: HullTriggerValidationFunction = (
  events: Array<HullEvent>,
  whitelist: Array<string>
): boolean %checks =>
  !_.isEmpty(intersectionWithEvent(events, whitelist));

// TODOANDY -> is this a custom entry? We already use `ALL` as a value everywhere else.
const validateSegments: HullTriggerValidationFunction = (
  segments: Array<HullSegment>,
  whitelist: Array<string>
): boolean %checks => !_.isEmpty(intersectionWithSegment(segments, whitelist));

const excludeSegments: HullTriggerValidationFunction = (
  segments: Array<HullSegment>,
  blacklist: Array<string>
): boolean %checks => _.isEmpty(intersectionWithSegment(segments, blacklist));

const required: HullTriggerValidationFunction = (
  obj,
  whitelist: Array<string>
): boolean %checks => !_.isEmpty(obj);

const isValidSubEntity = (
  entity: {},
  rules: Array<HullTriggerValidation>,
  whitelist: HullTriggerList
): boolean %checks =>
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
  whitelist: HullTriggerList
): boolean %checks => {
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
): boolean %checks =>
  _.every(inputData, (whitelist: HullTriggerList, path: string) => {
    const triggerDefinition: HullTriggerDefinition = _.get(
      triggerDefinitions,
      path,
      {}
    );
    const { validations /* type, filters */ } = triggerDefinition;
    return isValidMessage(message, validations, whitelist);
  });

module.exports = {
  excludeSegments,
  isValidTrigger,
  isValidMessage,
  isValidSubEntity,
  validateChanges,
  validateSegments,
  validateEvents,
  required
};

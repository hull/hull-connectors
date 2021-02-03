// @flow
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
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";
import { getStandardAttributeName } from "./utils";

const _ = require("lodash");

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

const getChangedAttributes = (
  changes: $PropertyType<
    $PropertyType<HullUserUpdateMessage, "changes">,
    "user"
  >
) => [
  "ALL",
  "all_attributes",
  ..._.reduce(
    changes,
    (changeList, value, key) => {
      const attributeName = getStandardAttributeName(key);
      changeList.push(attributeName);
      return changeList;
    },
    []
  )
];

const intersectionWithSegment = (
  segments: Array<HullSegment>,
  list: Array<string>
) => _.intersection(getSegmentIds(segments), list);

const intersectionWithEvent = (events: Array<HullEvent>, list: Array<string>) =>
  _.intersection(getEventNames(events), list);

const intersectionWithChangedAttribute = (
  changes: $PropertyType<
    $PropertyType<HullUserUpdateMessage, "changes">,
    "user"
  >,
  list: Array<string>
) => _.intersection(getChangedAttributes(changes), list);

const validateChanges: HullTriggerValidationFunction = (
  changes: $PropertyType<
    $PropertyType<HullUserUpdateMessage, "changes">,
    "user"
  >,
  whitelist: Array<string>
): boolean %checks =>
  !_.isEmpty(intersectionWithChangedAttribute(changes, whitelist));

const validateEvents: HullTriggerValidationFunction = (
  events: Array<HullEvent>,
  whitelist: Array<string>
): boolean %checks => !_.isEmpty(intersectionWithEvent(events, whitelist));

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

const empty: HullTriggerValidationFunction = (
  obj,
  whitelist: Array<string>
): boolean %checks => _.isEmpty(obj);

const isValidSubEntity = (
  entity: {},
  rules: Array<HullTriggerValidation>,
  whitelist: HullTriggerList
): boolean %checks =>
  _.every(rules, rule => {
    // TODO: Whitelist could be a boolean/undefined/..., yet we assume in every validation function that it's an array of string...
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
  required,
  empty
};

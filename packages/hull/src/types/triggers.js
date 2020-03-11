// @flow
import TRIGGERS from "../../../hull-connector-framework/src/purplefusion/triggers/triggers";

export type HullStreamType = "csv" | "json";

export type HullServiceObjectDefinition = {
  name: string,
  service_name: string,
  stream?: HullStreamType
};
export type HullTriggerList = boolean | Array<string>;
export type HullTriggerSet = {
  [string: $Keys<typeof TRIGGERS>]: HullTriggerList
};

export type HullTrigger = {
  cleanedEntity: {},
  serviceAction: {
    url: string
  },
  inputData: HullTriggerSet
};

export type HullTriggerValidationFunction = (any, Array<string>) => boolean;
export type HullTriggerValidation =
  | HullTriggerValidationFunction
  | {}
  | boolean
  | string;
export type HullTriggerValidations = {
  [string]: HullTriggerValidation | Array<HullTriggerValidation>
};

export type HullTriggerDefinition = {
  type: HullServiceObjectDefinition,
  filters: {
    [string]: any
  },
  validations: HullTriggerValidations
};

export type HullTriggerDefinitions = {
  [string]: HullTriggerDefinition
};

export type HullTriggerValidationRule = {};

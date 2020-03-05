// @flow

export type HullStreamType = "csv" | "json";

export type HullServiceObjectDefinition = {
  name: string,
  service_name: string,
  stream?: HullStreamType
};
export type HullTriggerWhitelist = boolean | Array<string>;

export type HullTrigger = {
  serviceAction: {
    url: string
  },
  inputData: {
    [string]: HullTriggerWhitelist
  }
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

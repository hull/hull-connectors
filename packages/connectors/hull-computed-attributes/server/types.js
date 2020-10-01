// @flow
import type { HullUserUpdateMessage } from "hull";

export type ComputedAttributeDefinition = {
  computed_attribute: string,
  type: "string" | "number" | "boolean" | "date",
  strategy: "set" | "setIfNull",
  operation: "attribute" | "mapping" | "fallback" | "value",
  params:
    | {
        attributes: Array<string>
      }
    | {
        value: string
      }
    | {
        attributes: string
      }
    | {
        attributes: Array<string>,
        mapping: Array<{ source: string, destination: string }>
      }
};
export type ComputeParams = {
  computedAttributes: Array<ComputedAttributeDefinition>,
  payload: HullUserUpdateMessage
};
export type Payload = {};

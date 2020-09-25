// @flow
import type { HullUserUpdateMessage } from "hull";

export type ComputedAttributeDefinition = {
  target: string,
  type: "string" | "number" | "boolean" | "date",
  strategy: "set" | "setIfNull",
  operation: "attribute" | "mapping" | "fallback" | "value",
  params:
    | {
        properties: Array<string>
      }
    | {
        value: string
      }
    | {
        property: string
      }
    | {
        property: string,
        mapping: Array<{ source: string, destination: string }>
      }
};
export type ComputeParams = {
  computedAttributes: Array<ComputedAttributeDefinition>,
  payload: HullUserUpdateMessage
};
export type Payload = {};

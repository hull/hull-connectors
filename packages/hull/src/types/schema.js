// @flow

export type HullEventSchemaEntry = {
  created_at: string,
  name: string,
  properties: Array<string>,
  updated_at: string,
  emitted: boolean
};

export type HullAttributeSchemaEntry = {
  key: string,
  type: "string" | "date" | "boolean" | "event" | "number" | "json",
  configurable: boolean,
  visible: boolean,
  track_changes: boolean
};

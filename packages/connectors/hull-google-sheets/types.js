// @flow

export type ImportType = "user" | "account" | "user_event";

export type Row = {
  ident: {},
  traits: {}
};
export type ImportBody = {
  rows: Array<Row>,
  type: ImportType
};

/* Client-side */

export type SettingsType = {
  hullToken?: string
};
export type MappingType = {
  hull: string,
  column: number
  // overwrite?: boolean,
  // enabled?: boolean
};
export type AttributeMapping = Array<MappingType>;

export type ImportStatusType = "done" | "working" | "error";

export type ImportProgressType = {
  imported: number,
  skipped: number,
  empty: number
};

export type GetActiveSheetResponse = {
  index: number,
  name: string,
  importProgress: ImportProgressType
};

export type Column = string;

export type GoogleColumns = Array<string>;
export type HullAttributes = Array<string>;

export type UserClaims = {
  email?: string,
  anonymous_id?: string,
  external_id?: string
};

export type AccountClaims = {
  domain?: string,
  anonymous_id?: string,
  external_id?: string
};

export type ClaimsType = UserClaims | AccountClaims;

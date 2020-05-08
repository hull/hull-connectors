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
  service: string,
  overwrite?: boolean,
  enabled?: boolean
};
export type AttributeMapping = Array<MappingType>;

export type ImportStatusType = {
  status: "done" | "working" | "error",
  result?: {
    imported: number
  },
  message?: string
};

export type ImportProgressType = {
  imported: number,
  skipped: number,
  empty: number
};

export type UserPropsType = {
  token: string,
  mapping: AttributeMapping,
  claims: AttributeMapping,
  settings: SettingsType,
  type: ImportType,
  source: string
};

export type GetActiveSheetResponse = {
  activeSheetIndex: number,
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

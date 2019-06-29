// @flow

import type {
  EntityScopedClient,
  AccountScopedClient,
  UserScopedClient
} from "./client";

const propertiesUtils = require("./utils/properties");
const settingsUtils = require("./utils/settings");
const traitsUtils = require("./utils/traits");

export type HullEntityScopedClient =
  | EntityScopedClient
  | AccountScopedClient
  | UserScopedClient;

// ====================================
// Data Types
// ====================================

/**
 * All attribtues names are strings
 */
export type HullAttributeName = string;

/**
 * These are possible values
 */
export type HullAttributeValue = string | boolean | Array<string> | number;

/**
 * When writing attributes we can specify both the value with operation
 * @see https://www.hull.io/docs/references/api/#user-attributes
 */
export type HullAttributeOperation = {|
  operation: "set" | "setIfNull" | "inc" | "dec",
  value: HullAttributeValue
|};

/**
 * Possible entity types
 */
export type HullEntityType = "account" | "user";

export type HullSegmentType = "users_segment" | "accounts_segment";

/**
 * An object representing the Hull Segment
 * Used in read operations
 */
export type HullSegment = {
  id: string,
  name: string,
  // stats?: {
  //   users?: number,
  //   accounts?: number // is it really there?
  // },
  // query?: {},
  created_at: string,
  updated_at: string
};
export type HullUserSegment = HullSegment & {
  type: "users_segment"
};
export type HullAccountSegment = HullSegment & {
  type: "accounts_segment"
};

/*
 * --- Data Structures To Use When Writing To Platform ---
 */

/**
 * This are claims we can use to identify account
 */
export type HullAccountClaims = {
  id?: string,
  domain?: ?string,
  external_id?: ?string,
  anonymous_id?: ?string
};

/**
 * This are claims we can use to identify user
 */
export type HullUserClaims = {
  id?: string,
  email?: ?string,
  external_id?: ?string,
  anonymous_id?: ?string
};

/**
 * This is a combined entity claims type. It's either account or user claims
 */
export type HullEntityClaims = HullUserClaims | HullAccountClaims;

/**
 * Additional claims which can be added to the main identity claims,
 * both for users and account which change resolution behavior
 */
export type HullAdditionalClaims = {|
  create?: boolean,
  scopes?: Array<string>,
  active?: boolean
|};

/**
 * This is a hash object which allows to set traits on account.
 * This are direct attribute values or operation definitions
 */
export type HullAccountAttributes = {
  [HullAttributeName]: HullAttributeValue | HullAttributeOperation
};

/**
 * This is a hash object which allows to set traits on user.
 * This are direct attribute values or operation definitions
 */
export type HullUserAttributes = {
  [HullAttributeName]: HullAttributeValue | HullAttributeOperation
};

/**
 * This is a combined entity attributes type. It's either account or user attributes
 */
export type HullEntityAttributes = HullAccountAttributes | HullUserAttributes;

/**
 * Supports the context object for the Traits call
 */
export type HullAttributeContext = {
  source?: string
};

/**
 * This is an event name which we use when tracking an event
 */
export type HullUserEventName = string;

/**
 * This is are event's properties which we use when tracking an event
 */
export type HullUserEventProperties = {
  [HullEventProperty: string]: string
};

/**
 * This is additional context passed with event
 */
export type HullUserEventContext = {
  location?: {},
  page?: {
    referrer?: string
  },
  referrer?: {
    url: string
  },
  os?: {},
  useragent?: string,
  ip?: string | number
};

/*
 * --- Data Structures To Use When Reading From Platform ---
 */

/**
 * Combined ident and attributes object for account coming from platform
 */
export type HullAccount = {
  id?: string,
  domain?: ?string,
  external_id?: ?string,
  anonymous_ids?: ?Array<string>,
  anonymous_id?: ?string, // @TODO: Flow Workaround -> force anonymous_id to be recognized as a ?string, Should be forced on Platform for safety
  name?: ?string,
  [HullAttributeName]: HullAttributeValue
};

/**
 * Combined ident and attributes object for user coming from platform
 */
export type HullUser = {
  id: string,
  email?: ?string,
  contact_email?: ?string,
  external_id: ?string,
  anonymous_ids: ?Array<string>,
  account?: HullAccount,
  // @TODO: Flow Workaround -> force anonymous_id to be recognized as a ?string, Should be forced on Platform for safety
  anonymous_id?: ?string,
  segment_ids: Array<string> | null,
  domain?: ?string,
  [HullAttributeName]: HullAttributeValue
};

/**
 * Common entity type, can be any user or account
 */
export type HullEntity = HullAccount | HullUser;

/**
 * Event coming from platform
 */
export type HullEventName = string;
export type HullEventContext = {};
export type HullEventProperties = {};
export type HullEvent = {
  event_id: string,
  event: HullEventName,
  created_at: string,
  event_source?: string,
  event_type?: string,
  track_id?: string,
  user_id?: string,
  anonymous_id?: ?string,
  session_id?: string,
  ship_id?: string,
  app_id?: string,
  app_name?: string,
  context: HullEventContext,
  properties: HullEventProperties
};

/**
 * Configuration which can be passed to the HullClient constructor
 * We cannot use exact type here.
 */
export type HullClientConfig = {
  id?: string,
  secret?: string,
  organization?: string,
  domain?: string,
  namespace?: string,
  requestId?: string,
  connectorName?: string,
  firehoseUrl?: ?string,
  timeout?: number,
  retry?: number,
  protocol?: string,
  prefix?: string,
  logLevel?: "info" | "error" | "warn" | "debug",
  userClaim?: string | HullUserClaims,
  accountClaim?: string | HullAccountClaims,
  subjectType?: HullEntityType,
  additionalClaims?: HullAdditionalClaims,
  accessToken?: string,
  hostSecret?: string,
  flushAt?: number,
  flushAfter?: number,
  version?: string,
  logs?: Array<Object>,
  captureLogs?: boolean,
  firehoseEvents?: Array<Object>,
  captureFirehoseEvents?: boolean
};

/**
 * Definition of logger object on HullClient instance
 */
type loggerFunction = (message: string, data?: {}) => void;
export type HullClientLogger = {|
  log: loggerFunction,
  silly: loggerFunction,
  debug: loggerFunction,
  verbose: loggerFunction,
  info: loggerFunction,
  warn: loggerFunction,
  error: loggerFunction
|};

// Definition of static logger param available on HullClient class
export type HullClientStaticLogger = {|
  ...HullClientLogger,
  transports: Object
|};

/**
 * Definition of utilities object
 */
export type HullClientUtils = {|
  traits: typeof traitsUtils,
  settings: typeof settingsUtils,
  properties: typeof propertiesUtils
|};

export type HullProperties = {
  [HullPropertyName: string]: {
    id: string,
    text: string,
    type: string,
    id_path: Array<string>,
    path: Array<string>,
    title: string,
    key: string
  }
};

// @flow

import type {
  HullAccountAttributes,
  HullUserAttributes,
  HullConnector,
  HullUserClaims,
  HullEntityClaims,
  HullAdditionalClaims,
  HullAccountClaims,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullAttributeContext,
  HullFetchedUser,
  HullEntityName,
  HullEventSchemaEntry
} from "hull";
import { Map } from "immutable";

export type ClaimsOptions = HullAdditionalClaims;
export type Attributes = HullUserAttributes | HullAccountAttributes;
export type AttributesContext = HullAttributeContext;

export type Ship = {
  id: string,
  private_settings: {
    code?: string
  }
};

export type UserTraits = {
  claims: HullUserClaims,
  attributes: Attributes
};
export type AccountTraits = {
  claims: HullAccountClaims,
  attributes: Attributes
};
export type TraitsCall<ClaimType> = {
  claims: ClaimType,
  attributes: Attributes
};

export type Traits = UserTraits | AccountTraits;

export type Links = {
  claims: HullEntityClaims,
  accountClaims: HullEntityClaims
};

export type Event = {
  claims: HullUserClaims,
  event: {
    eventName: string,
    properties?: {},
    context?: {}
  }
};

export type Payload =
  | {
      query: {},
      params: {},
      cookies: {},
      method: string,
      ip: string,
      variables: {},
      headers: {
        [string]: string
      },
      body: mixed
    }
  | {
      ...HullFetchedUser,
      variables: {}
    }
  | {
      variables: {}
    };

export type HullAliasOperation = "alias" | "unalias";
type HullUserClaimsMap = Map<$Keys<HullUserClaims>, $Values<HullUserClaims>>;
type HullAccountClaimsMap = Map<$Keys<HullUserClaims>, $Values<HullUserClaims>>;
type HullAttributesMap = Map<$Keys<Attributes>, $Values<Attributes>>;
export type HullAliasOperations = Array<
  Map<HullEntityClaims, HullAliasOperation>
>;
export type IngestionResult = {|
  accountAliases: Map<
    HullAccountClaimsMap,
    Map<HullAccountClaimsMap, HullAliasOperation>
  >,
  accountLinks: Map<HullUserClaimsMap, HullAccountClaimsMap>,
  accountTraits: Map<HullAccountClaimsMap, HullAttributesMap>,
  events: Array<Event>,
  userAliases: Map<
    HullUserClaimsMap,
    Map<HullUserClaimsMap, HullAliasOperation>
  >,
  userTraits: Map<HullUserClaimsMap, HullAttributesMap>,
  claims?: HullEntityClaims
|};
export type SerializedIngestionResult = {|
  accountAliases: Array<[HullAccountClaims, HullAliasOperations]>,
  accountLinks: Array<[HullUserClaims, HullAccountClaims]>,
  accountTraits: Array<[HullAccountClaims, Attributes]>,
  events: Array<Event>,
  userAliases: Array<[HullUserClaims, HullAliasOperations]>,
  userTraits: Array<[HullUserClaims, Attributes]>,
  claims?: HullEntityClaims
|};
export type ResultBase = {|
  data: {},
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  isAsync: boolean,
  success: boolean
|};
export type Result = {
  ...$Exact<IngestionResult>,
  ...$Exact<ResultBase>
};
export type SerializedResult = {
  ...$Exact<SerializedIngestionResult>,
  ...$Exact<ResultBase>
};

export type SupportedLanguage = "javascript" | "jsonata";

export type PreviewRequest = {
  payload: Payload,
  entity?: HullEntityName,
  language?: SupportedLanguage,
  claims?: HullEntityClaims,
  fallbacks?: {},
  code: string
};

export type PreviewResponse = SerializedResult;

export type Entry = {
  date: string,
  result: Result | SerializedResult,
  code: string,
  payload: Payload,
  error?: string
};

export type ComputeOptions = {
  code: string,
  language?: SupportedLanguage,
  claims?: HullEntityClaims,
  entity?: HullEntityName,
  preview: boolean,
  source: string,
  payload:
    | {}
    | ({ variables: {} } & (
        | Payload
        | HullUserUpdateMessage
        | HullAccountUpdateMessage
      ))
};

type AnyFunction = any => any;

type HullShape = {
  asUser: (
    HullUserClaims,
    HullAdditionalClaims
  ) => {
    traits: HullUserAttributes => void,
    identify: HullUserAttributes => void,
    track: (string, {}) => void
  },
  asAccount: (
    HullAccountClaims,
    HullAdditionalClaims
  ) => {
    traits: HullUserAttributes => void,
    identify: HullUserAttributes => void
  }
};

export type Sandbox = {
  moment: AnyFunction,
  urijs: AnyFunction,
  lodash: AnyFunction,
  ship: HullConnector,
  hull?: HullShape,
  responses: Array<any>
};

export type ClaimsPayload = {
  claims: HullUserClaims,
  claimsOptions: HullAdditionalClaims,
  accountClaims?: HullAccountClaims,
  accountClaimsOptions?: HullAdditionalClaims
};
export type ClaimsValidation =
  | {
      ...ClaimsPayload,
      valid: true,
      entity: HullEntityName,
      message: void,
      error: void
    }
  | {
      ...ClaimsPayload,
      valid: false,
      entity: HullEntityName,
      message: string,
      error: string
    };

export type Current = {
  code: string
};
export type IncomingConfResponse = {|
  language: "javascript",
  code: string,
  url: string
|};
export type ProcessorConfResponse = {|
  eventSchema: Array<HullEventSchemaEntry>,
  language: "javascript",
  entity: "user" | "account",
  code: string
|};
export type OutgoingConfResponse = {|
  eventSchema: Array<HullEventSchemaEntry>,
  headers: {},
  url: string,
  language: "javascript",
  entity: "user" | "account",
  code: string
|};

export type BasicConfResponse = {|
  language: "javascript",
  entity?: "user" | "account",
  code: string
|};
export type ReplConfResponse = BasicConfResponse;

export type ConfResponse =
  | BasicConfResponse
  | OutgoingConfResponse
  | IncomingConfResponse
  | ProcessorConfResponse;

export type Config = {
  id: string,
  secret: string,
  organization: string
};

export type EngineState = {
  error?: string,
  computing: boolean,
  loading: boolean,
  initialized: boolean,
  url?: string,
  config: Config,
  selected?: Entry,
  current?: Entry,
  code?: string,
  language?: string,
  entity: HullEntityName,
  fallbacks?: string,
  recent: Array<Entry>
};
export type EventSelect = {
  value: string,
  label: string
};
export type ProcessorEngineState = {
  error?: string,
  computing: boolean,
  loading: boolean,
  initialized: boolean,
  url?: string,
  config: Config,
  selected?: Entry,
  current?: Entry,
  recent: Array<Entry>,
  code?: string,
  language?: string,
  entity: HullEntityName,
  search?: string,
  selectedEvents?: Array<EventSelect>
};
export type RecentEngineState = EngineState & {};

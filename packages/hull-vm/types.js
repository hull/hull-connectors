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
  HullEntityName,
  HullFetchedUser
} from "hull";
import type { Map, RecordOf } from "immutable";

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
    };

export type HullAliasOperation = "alias" | "unalias";

type HullUserClaimsMap = Map<$Keys<HullUserClaims>, $Values<HullUserClaims>>;
type HullAccountClaimsMap = Map<
  $Keys<HullAccountClaims>,
  $Values<HullAccountClaims>
>;

type HullAttributesMap = Map<$Keys<Attributes>, $Values<Attributes>>;

export type HullAliasOperations = Array<
  Map<HullEntityClaims, HullAliasOperation>
>;

type UserClaim = {
  asUser: HullUserClaimsMap,
  subject: "user"
};
type AccountClaim = {
  asUser?: HullUserClaimsMap,
  asAccount: HullAccountClaimsMap,
  subject: "account"
};

export type HullClaims = {
  asUser?: HullUserClaimsMap,
  asAccount?: HullAccountClaimsMap,
  subject: "user" | "account"
};

export type HullUserClaimsRecord = RecordOf<UserClaim>;
export type HullAccountClaimsRecord = RecordOf<AccountClaim>;
export type HullClaimsRecord = RecordOf<HullClaims>;
// type Claim = UserClaim | AccountClaim;

export type Event = {
  claims: HullClaimsRecord,
  event: {
    eventName: string,
    properties?: {},
    context?: {}
  }
};

export type SerializedEvent = {
  claims: HullClaims,
  event: {
    eventName: string,
    properties?: {},
    context?: {}
  }
};

export type Result = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Map<HullUserClaimsRecord, HullAttributesMap>,
  userAliases: Map<
    HullUserClaimsRecord,
    Map<HullUserClaimsMap, HullAliasOperation>
  >,
  accountTraits: Map<HullAccountClaimsRecord, HullAttributesMap>,
  accountAliases: Map<
    HullAccountClaimsRecord,
    Map<HullAccountClaimsMap, HullAliasOperation>
  >,
  events: Array<Event>,
  claims?: HullEntityClaims,
  isAsync: boolean,
  success: boolean
};

export type SerializedResult = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Array<[HullClaims, Attributes]>,
  accountTraits: Array<[HullClaims, Attributes]>,
  userAliases: Array<
    [
      HullClaims,
      Array<{ claim: HullUserClaims, operation: HullAliasOperation }>
    ]
  >,
  accountAliases: Array<
    [
      HullClaims,
      Array<{ claim: HullAccountClaims, operation: HullAliasOperation }>
    ]
  >,
  events: Array<SerializedEvent>,
  claims?: HullEntityClaims,
  isAsync: boolean,
  success: boolean
};

export type PreviewRequest = {
  payload: Payload,
  entity?: HullEntityName,
  claims?: {},
  code: string
};
export type PreviewResponse = SerializedResult;

export type Entry = {
  error?: string,
  connectorId: string,
  code: string,
  payload: Payload,
  result: Result | SerializedResult,
  date: string,
  editable?: boolean
};

export type ComputeOptions = {
  code: string,
  claims?: HullEntityClaims,
  entity?: HullEntityName,
  preview: boolean,
  source: string,
  payload: { variables: {} } & (
    | Payload
    | HullUserUpdateMessage
    | HullAccountUpdateMessage
  )
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
  connectorId: string,
  code: string
};
export type IncomingConfResponse = {
  current: Current,
  url: string
};
export type ProcessorConfResponse = {
  current: Current
};
export type ConfResponse = IncomingConfResponse | ProcessorConfResponse;

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
  entity?: HullEntityName,
  search?: string,
  selectedEvents: Array<EventSelect>
};
export type RecentEngineState = EngineState & {};

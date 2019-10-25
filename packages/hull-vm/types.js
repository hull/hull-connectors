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
  HullEntityType,
  HullFetchedUser
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
      headers: {
        [string]: string
      },
      body: mixed
    }
  | HullFetchedUser;

export type HullAliasOperation = "alias" | "unalias";
type HullUserClaimsMap = Map<$Keys<HullUserClaims>, $Values<HullUserClaims>>;
type HullAccountClaimsMap = Map<$Keys<HullUserClaims>, $Values<HullUserClaims>>;
type HullAttributesMap = Map<$Keys<Attributes>, $Values<Attributes>>;
export type HullAliasOperations = Array<
  Map<HullEntityClaims, HullAliasOperation>
>;
export type Result = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Map<HullUserClaimsMap, HullAttributesMap>,
  accountTraits: Map<HullAccountClaimsMap, HullAttributesMap>,
  userAliases: Map<
    HullUserClaimsMap,
    Map<HullUserClaimsMap, HullAliasOperation>
  >,
  accountAliases: Map<
    HullAccountClaimsMap,
    Map<HullAccountClaimsMap, HullAliasOperation>
  >,
  accountLinks: Map<HullUserClaimsMap, HullAccountClaimsMap>,
  events: Array<Event>,
  claims?: HullEntityClaims,
  isAsync: boolean,
  success: boolean
};
export type SerializedResult = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Array<[HullUserClaims, Attributes]>,
  accountTraits: Array<[HullAccountClaims, Attributes]>,
  userAliases: Array<[HullUserClaims, HullAliasOperations]>,
  accountAliases: Array<[HullAccountClaims, HullAliasOperations]>,
  events: Array<Event>,
  accountLinks: Array<[HullUserClaims, HullAccountClaims]>,
  claims?: HullEntityClaims,
  isAsync: boolean,
  success: boolean
};

export type PreviewRequest = {
  payload: Payload,
  entityType?: "user" | "account",
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
  entityType?: HullEntityType,
  preview: boolean,
  source: string,
  payload: Payload | HullUserUpdateMessage | HullAccountUpdateMessage
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
      entity: HullEntityType,
      message: void,
      error: void
    }
  | {
      ...ClaimsPayload,
      valid: false,
      entity: HullEntityType,
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
  entity?: "user" | "account",
  search?: string,
  selectedEvents: Array<EventSelect>
};
export type RecentEngineState = EngineState & {};

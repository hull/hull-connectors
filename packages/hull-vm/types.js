// @flow

import type {
  HullAccountAttributes,
  HullUserAttributes,
  HullConnector,
  HullUserClaims,
  HullAdditionalClaims,
  HullAccountClaims,
  HullFetchedUser,
  HullFetchedAccount,
  HullAttributeContext,
  HullEntitySymbol
} from "hull";

export type Claims = HullUserClaims | HullAccountClaims;
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
  claims: Claims,
  accountClaims: Claims
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

export type Result = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Map<HullUserClaims, Attributes>,
  accountTraits: Map<HullAccountClaims, Attributes>,
  events: Array<Event>,
  accountLinks: Map<HullUserClaims, HullAccountClaims>,
  isAsync: boolean,
  success: boolean
};
export type SerializedResult = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Array<[HullUserClaims, Attributes]>,
  accountTraits: Array<[HullAccountClaims, Attributes]>,
  events: Array<Event>,
  accountLinks: Array<[HullUserClaims, HullAccountClaims]>,
  isAsync: boolean,
  success: boolean
};

export type PreviewRequest = {
  payload: Payload,
  code: string
};
export type PreviewResponse = SerializedResult;

export type Entry = {
  connectorId: string,
  code: string,
  payload: Payload,
  result: Result | SerializedResult,
  date: string,
  editable?: boolean
};

export type ComputeOptions = {
  code: string,
  claims?: HullUserClaims | HullAccountClaims,
  entity?: HullEntitySymbol,
  preview: boolean,
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
      subject: HullEntitySymbol,
      message: void,
      error: void
    }
  | {
      ...ClaimsPayload,
      valid: false,
      subject: HullEntitySymbol,
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
  initializing: boolean,
  initialized: boolean,
  url?: string,
  config: Config,
  selected?: Entry,
  current?: Entry,
  recent: Array<Entry>
};
export type ProcessorEngineState = EngineState & {
  search?: string
};
export type RecentEngineState = EngineState & {};

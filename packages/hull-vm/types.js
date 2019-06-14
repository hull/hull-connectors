// @flow

import type {
  HullClient,
  HullAccountAttributes,
  HullUserAttributes,
  HullConnector,
  HullUserClaims,
  HullAdditionalClaims,
  HullAccountClaims,
  HullUserUpdateMessage,
  HullAttributeContext
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
  | HullUserUpdateMessage;

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

export type PreviewRequest = {
  payload: Payload,
  code: string
};
export type PreviewResponse = Result;

export type Entry = {
  connectorId: string,
  code: string,
  payload: Payload,
  result: Result,
  date: string,
  editable?: boolean
};

export type ComputeOptions = {
  code: string,
  preview: boolean,
  payload: Payload
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
export type ClaimsSubject = "user" | "account";
export type ClaimsValidation =
  | {
      ...ClaimsPayload,
      valid: true,
      subject: ClaimsSubject,
      message: void,
      error: void
    }
  | {
      ...ClaimsPayload,
      valid: false,
      subject: ClaimsSubject,
      message: string,
      error: string
    };

export type Current = {
  connectorId: string,
  code: string
};
export type ConfResponse = {
  current: Current,
  url: string
};

export type Config = {
  id: string,
  secret: string,
  organization: string
};

export type EngineState = {
  error?: string,
  computing: boolean,
  initialized: boolean,
  loadingRecent: boolean,
  initialized: boolean,
  url?: string,
  config: Config,
  selected?: Entry,
  current?: Entry,
  recent: Array<Entry>
};

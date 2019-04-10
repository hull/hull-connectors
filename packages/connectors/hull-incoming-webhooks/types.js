// @flow

import type {
  HullClient,
  HullAccountAttributes,
  HullUserAttributes,
  HullConnector,
  HullUserClaims,
  HullAdditionalClaims,
  HullAccountClaims,
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
  claimsOptions: HullAdditionalClaims,
  traits: {
    attributes: Attributes,
    context: AttributesContext
  }
};
export type AccountTraits = {
  claims: HullAccountClaims,
  claimsOptions: HullAdditionalClaims,
  traits: {
    attributes: Attributes,
    context: AttributesContext
  }
};
export type Traits = UserTraits | AccountTraits;

export type Links = {
  claims: Claims,
  claimsOptions: HullAdditionalClaims,
  accountClaims: Claims,
  accountClaimsOptions: HullAdditionalClaims
};

export type Event = {
  claims: HullUserClaims,
  claimsOptions: HullAdditionalClaims,
  event: {
    eventName: string,
    properties?: {},
    context?: {}
  }
};

export type Payload = {
  query: {},
  params: {},
  cookies: {},
  method: string,
  ip: string,
  headers: {
    [string]: string
  },
  body: mixed
};

export type Result = {
  logsForLogger: Array<string>,
  logs: Array<string | any>,
  errors: Array<string>,
  userTraits: Array<Traits>,
  accountTraits: Array<Traits>,
  events: Array<Event>,
  accountLinks: Array<Links>,
  isAsync: boolean,
  success: boolean
};

export type PreviewRequest = {
  payload: Payload,
  code: string
};

export type Entry = {
  connectorId: string,
  code: string,
  payload: Payload,
  result: Result,
  date: string
};

export type ComputeOptions = {
  code: string,
  preview: boolean,
  context: Payload,
  connector: HullConnector,
  client: HullClient
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

export type ConfResponse = {
  hostname: string,
  token: string
};

export type Config = {
  ship: string,
  secret: string,
  orgUrl: string
};

export type EngineState = {
  error?: string,
  computing: boolean,
  initialized: boolean,
  loadingRecent: boolean,
  loadingToken: boolean,
  hostname?: string,
  token?: string,
  code: string,
  config: Config,
  current?: Entry,
  recent: Array<Entry>
};

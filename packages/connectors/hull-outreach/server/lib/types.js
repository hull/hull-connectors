/* @flow */
import type {
  HullAccount,
  HullUserClaims,
  HullAccountClaims,
  HullUserAttributes,
  HullAccountAttributes,
  HullUser
} from "hull";

import type { Readable } from "stream";

/*
 *** Hull Types. Replace when 0.14.0 is released
 */

export type HullMetrics = {
  increment(name: string, value: number, ...params: any[]): void,
  value(name: string, value: number, ...params: any[]): void
};

export type HullClientLogger = {
  log(message: ?any, ...optionalParams: any[]): void,
  info(message: ?any, ...optionalParams: any[]): void,
  warn(message: ?any, ...optionalParams: any[]): void,
  error(message: ?any, ...optionalParams: any[]): void,
  debug(message: ?any, ...optionalParams: any[]): void
};

export type HullClientConfiguration = {
  prefix: string,
  domain: string,
  protocol: string,
  id: string,
  secret: string,
  organization: string,
  version: string
};

export type HullClientApiOptions = {
  timeout: number,
  retry: number
};

export type HullClientUtilTraits = {
  group(user: HullUser | HullAccount): Object,
  normalize(traits: Object): HullUserAttributes
};

export type HullClientUtils = {
  traits: HullClientUtilTraits
};

export type HullClientTraitsContext = {
  source: string
};

export type HullFieldDropdownItem = {
  value: string,
  label: string
};

/**
 * This is an event name which we use when tracking an event
 */
export type HullEventName = string;

/**
 * This is are event's properties which we use when tracking an event
 */
export type HullEventProperties = {
  [HullEventProperty: string]: string
};

/**
 * This is additional context passed with event
 */
export type HullEventContext = {
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

export type HullClient = {
  configuration: HullClientConfiguration,
  asUser(ident: HullUserClaims): HullClient,
  asAccount(ident: HullAccountClaims): HullClient,
  logger: HullClientLogger,
  traits(
    attributes: HullUserAttributes | HullAccountAttributes,
    context: HullClientTraitsContext
  ): Promise<any>, // Needs to be refined further
  track(
    event: string,
    properties: HullEventProperties,
    context: HullEventContext
  ): Promise<any>,
  get(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  post(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  put(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  del(
    url: string,
    params?: Object,
    options?: HullClientApiOptions
  ): Promise<any>,
  account(ident: HullAccountIdent): HullClient,
  utils: HullClientUtils
};

/*
 *** Outreach.io Types, specific to this connector
 */

export type OutreachObjectType = "Account" | "Prospect";

export type OutreachOutboundMapping = {
  hull_field_name: string,
  outreach_field_name: string
};

export type OutreachConnectorSettings = {
  synchronized_account_segments: Array<string>,
  synchronized_user_segments: Array<string>,
  account_attributes_outbound: Array<OutreachOutboundMapping>,
  account_attributes_inbound: Array<string>,
  prospect_attributes_outbound: Array<OutreachOutboundMapping>,
  prospect_attributes_inbound: Array<string>,
  account_identifier_hull: string,
  account_identifier_service: string
};

export type OutreachGenericIdentifierRead = {
  type: string,
  id: number
};

export type OutreachAccountAttributes = {
  companyType: string,
  createdAt: Date,
  custom1: string,
  custom2: string,
  custom3: string,
  custom4: string,
  custom5: string,
  custom6: string,
  custom7: string,
  custom8: string,
  custom9: string,
  custom10: string,
  custom11: string,
  custom12: string,
  custom13: string,
  custom14: string,
  custom15: string,
  custom16: string,
  custom17: string,
  custom18: string,
  custom19: string,
  custom20: string,
  custom21: string,
  custom22: string,
  custom23: string,
  custom24: string,
  custom25: string,
  custom26: string,
  custom27: string,
  custom28: string,
  custom29: string,
  custom30: string,
  custom31: string,
  custom32: string,
  custom33: string,
  custom34: string,
  custom35: string,
  customId: string,
  description: string,
  domain: string,
  externalSource: string,
  followers: string,
  foundedAt: Date,
  industry: string,
  linkedInEmployees: string,
  linkedInUrl: string,
  locality: string,
  name: string,
  named: boolean,
  naturalName: string,
  numberOfEmployees: number,
  tags: Array<string>,
  updatedAt: Date,
  websiteUrl: string
};

export type OutreachAccountReadData = {
  type: string,
  id: string,
  attributes: OutreachAccountAttributes
};

export type OutreachAccountRead = {
  data: OutreachAccountReadData
};

export type OutreachAccountWriteData = {
  type: string,
  id?: number,
  attributes: OutreachAccountAttributes
};

export type OutreachAccountWrite = {
  data: OutreachAccountWriteData
};

export type OutreachProspectAttributes = {
  addedAt: string,
  addressCity: string,
  addressCountry: string,
  addressState: string,
  addressStreet: string,
  addressStreet2: string,
  addressZip: string,
  angelListUrl: string,
  availableAt: string,
  callsOptedOutAt: string,
  campaignName: string,
  clickCount: number,
  createdAt: Date,
  custom1: string,
  custom10: string,
  custom11: string,
  custom12: string,
  custom13: string,
  custom14: string,
  custom15: string,
  custom16: string,
  custom17: string,
  custom18: string,
  custom19: string,
  custom2: string,
  custom20: string,
  custom21: string,
  custom22: string,
  custom23: string,
  custom24: string,
  custom25: string,
  custom26: string,
  custom27: string,
  custom28: string,
  custom29: string,
  custom3: string,
  custom30: string,
  custom31: string,
  custom32: string,
  custom33: string,
  custom34: string,
  custom35: string,
  custom4: string,
  custom5: string,
  custom6: string,
  custom7: string,
  custom8: string,
  custom9: string,
  dateOfBirth: string,
  degree: string,
  emails: Array<string>,
  emailsOptedOutAt: string,
  engagedAt: string,
  engagedScore: number,
  eventName: string,
  externalId: string,
  externalOwner: string,
  externalSource: string,
  facebookUrl: string,
  firstName: string,
  gender: string,
  githubUrl: string,
  githubUsername: string,
  googlePlusUrl: string,
  graduationDate: string,
  homePhones: Array<string>,
  jobStartDate: string,
  lastName: string,
  linkedInConnections: string,
  linkedInId: string,
  linkedInSlug: string,
  linkedInUrl: string,
  middleName: string,
  mobilePhones: Array<string>,
  name: string,
  nickname: string,
  occupation: string,
  openCount: number,
  optedOut: boolean,
  optedOutAt: string,
  otherPhones: Array<string>,
  personalNote1: string,
  personalNote2: string,
  preferredContact: string,
  quoraUrl: string,
  region: string,
  replyCount: number,
  school: string,
  score: string,
  smsOptedOutAt: string,
  source: string,
  specialties: string,
  stackOverflowId: string,
  stackOverflowUrl: string,
  tags: Array<string>,
  timeZone: string,
  timeZoneIana: string,
  timeZoneInferred: string,
  title: String,
  touchedAt: string,
  twitterUrl: string,
  twitterUsername: string,
  updatedAt: Date,
  voipPhones: Array<string>,
  websiteUrl1: string,
  websiteUrl2: string,
  websiteUrl3: string,
  workPhones: Array<string>
};

export type OutreachProspectRelationships = {
  account: {
    data: OutreachGenericIdentifierRead
  }
};

export type OutreachProspectReadData = {
  id: string,
  type: string,
  attributes: OutreachProspectAttributes,
  relationships: OutreachProspectRelationships
};

export type OutreachProspectRead = {
  data: OutreachProspectReadData
};

export type OutreachProspectWriteData = {
  type: string,
  id?: number,
  attributes: OutreachProspectAttributes,
  relationships?: OutreachProspectRelationships
};

export type OutreachProspectWrite = {
  data: OutreachProspectWriteData
};

export type FilterResults<T> = {
  toSkip: Array<T>,
  toInsert: Array<T>,
  toUpdate: Array<T>,
  toDelete?: Array<T>
};

export type OutreachProspectUpdateEnvelope = {
  hullUser: HullUser, // an object taken from message.user but we need to mix in `account` property there
  outreachProspectId: number,
  outreachProspectWrite: OutreachProspectWrite, // the prospect object we want to use to write to API
  outreachProspectRead: OutreachProspectRead, // the prospect object we have received from the API
  skipReason: string,
  opsResult: string,
  error: string
};

export type OutreachAccountUpdateEnvelope = {
  hullAccount: HullAccount, // an object taken from message, to make it work the same as for UserUpdateEnvelope
  outreachAccountId: number,
  outreachAccountWrite: OutreachAccountWrite,
  outreachAccountRead: OutreachAccountRead,
  skipReason: string,
  opsResult: string,
  error: string
};

export type OutreachList<T> = {
  data: Array<T>,
  meta: OutreachListMeta
};

export type OutreachListMeta = {
  count: number
};

export type OutreachWebhookMeta = {
  deliveredAt: Date,
  eventName: string
};

export type OutreachWebhookData = {
  type: string,
  id: number,
  attribute: Object, // this has to be a generic object because it could be any attribute that has changed
  meta: OutreachWebhookMeta
};

export type OutreachWebhookPayload = {
  data: OutreachWebhookData
};

export type SuperAgentResponse<T> = {
  ...Readable,
  body: T,
  accepted: boolean,
  badRequest: boolean,
  charset: string,
  clientError: boolean,
  files: any,
  forbidden: boolean,
  get: (header: string) => string,
  header: any,
  info: boolean,
  noContent: boolean,
  notAcceptable: boolean,
  notFound: boolean,
  ok: boolean,
  redirect: boolean,
  serverError: boolean,
  status: number,
  statusType: number,
  text: string,
  type: string,
  unauthorized: boolean
};

export type OutreachFieldDefinition = {
  id: string,
  label: string,
  in: boolean,
  out: boolean,
  type?: string
};

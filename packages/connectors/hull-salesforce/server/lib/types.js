/* @flow */
/* eslint-disable */
import type {
  THullObject,
  THullUserUpdateMessage,
  THullAccountUpdateMessage
} from "hull";
import type { TAssignmentRule } from "./service-client/assignmentrules";

export type { THullObject } from "hull";
export type TResourceType = "Lead" | "Contact" | "Account" | "Task";

const SUPPORTED_RESOURCE_TYPES: Array<TResourceType> = [
  "Lead",
  "Contact",
  "Account"
];

export type TResourceTypeAssignmentRule = "Lead" | "Case";

export type TApiMethod = "insert" | "update" | "upsert";

export type TPrivateSettings = {
  privateSettings: Object
};

export type TFilterResults = {
  toInsert: Array<IUserUpdateEnvelope>,
  toUpdate: Array<IUserUpdateEnvelope>,
  toSkip: Array<IUserUpdateEnvelope>
};

export type ServiceObjectDefinition = {
  hull: string,
  service: string
};

export interface IUserUpdateEnvelope {
  message: THullUserUpdateMessage;
}

export interface IAccountUpdateEnvelope {
  message: THullAccountUpdateMessage;
}

export type TDeletedRecordInfo = {
  deletedDate: Date,
  id: string
};

export type TDeletedRecordsParameters = {
  start: Date,
  end: Date
};

export type TInsertUpdateOptions = {
  resource: TResourceType,
  leadAssignmentRule?: string
};

export interface IInsertUpdateOptions {
  resource: TResourceType;
  leadAssignmentRule?: string;
}

export type TApiOperation = {
  method: TApiMethod,
  resource: TResourceType,
  records: Array<Object>,
  externalIDFieldName?: string,
  leadAssignmentRule?: string
};

export interface IApiResultObject {
  resource: TResourceType;
  method: TApiMethod;
  record: Object;
  success: boolean;
  error: ?string | string[] | null;
}

export interface ILogger {
  log(message: ?any, ...optionalParams: any[]): void;
  info(message: ?any, ...optionalParams: any[]): void;
  warn(message: ?any, ...optionalParams: any[]): void;
  error(message: ?any, ...optionalParams: any[]): void;
  debug(message: ?any, ...optionalParams: any[]): void;
}

export interface IMetricsClient {
  increment(name: string, value: number): void;
  value(name: string, value: number): void;
}

export interface IOauth2Credentials {
  clientId: string;
  clientSecret: string;
}

export interface IConnectionOptions {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  oauth2: IOauth2Credentials;
}

export interface ISalesforceClientOptions {
  connection: IConnectionOptions;
  logger: ILogger;
  metrics: IMetricsClient;
}

export interface IServiceClient {
  queryRecordsById(type: TResourceType, ids: string[], fields: string[], options: Object): Promise<any[]>;
  insert(records: Array<THullObject>, options: IInsertUpdateOptions): Promise<IApiResultObject[]>;
  update(records: Array<THullObject>, options: TInsertUpdateOptions): Promise<IApiResultObject[]>;
  fetchFieldsList(type: TResourceType): any;
  fetchResourceSchema(type: TResourceType, fieldTypes: string): any;
  fetchAssignmentRules(type: TResourceTypeAssignmentRule): Promise<TAssignmentRule[]>;
  findLeads(query: any, fieldsList: string[], limit: number, skip: number): Promise<any[]>;
  findContacts(query: any, fieldsList: string[], limit: number, skip: number): Promise<any[]>;
  findAccounts(query: any, fieldsList: string[], limit: number, skip: number): Promise<any[]>;
  queryExistingRecords(type: string, sfdcId: string, recordIds: string[]): Promise<any[]>;
  getAllRecords(type: TResourceType, options: Object, onRecord: Function): Promise<*>;
  getDeletedRecords(type: TResourceType, options: TDeletedRecordsParameters): Promise<Array<TDeletedRecordInfo>>;
  exec(fn: string, ...args: any): Promise<any>;
}

export interface IAttributesMapper {
  mapToHullIdentityObject(resource: TResourceType, sfObject: Object, identityClaims: Array<Object>): Object;
  mapToServiceObject(resource: TResourceType, hullObject: any, segments: Array<Object>, accountSegments: Array<Object>): any;
  mapToHullAttributeObject(resource: TResourceType, sObject: any, resourceSchema: Object): any;
  mapToHullEvent(mappings: Object, resource: TResourceType, sObject: any): any;
}

export interface IQueryUtil {
  getSoqlFields(serviceType: string, fields: Array<string>, identityClaims: Array<Object>): Object;
  composeFindFields(serviceType: string, mappings: Object): Array<string>;
  extractUniqueValues(messages: Array<any>, path: string): Array<any>;
  buildQueryOpts(sfType: string, params: Array<Object>): Object;
  composeFindQuery(messages: Array<THullUserUpdateMessage> | Array<THullAccountUpdateMessage>, searchMapping: Object, hullType: string): Object;
}

export interface IFilterUtil {
  filterMessages(messages: Array<Object>, hullType: string, isBatch: boolean): Object;
  filterDuplicateMessages(messages: Array<Object>, entity: string): Array<Object>;
  filterFindableAccountMessages(messages: Array<Object>, isBatch: boolean): Array<Object>;
  filterFindableMessages(hullEntityType: string, messages: Array<Object>, isBatch: boolean): Array<Object>;
  filterLeadEnvelopes(envelopes: Array<IUserUpdateEnvelope>): TFilterResults;
  filterContactEnvelopes(envelopes: Array<IUserUpdateEnvelope>): TFilterResults;
  filterEnvelopes(envelopes: Array<IUserUpdateEnvelope>, resourceType: TResourceType): TFilterResults;
  filterAccountEnvelope(results: TFilterResults, envelope: Object, isBatch: boolean): TFilterResults;
  filterAccountEnvelopes(envelopes: Array<IUserUpdateEnvelope> | Array<IAccountUpdateEnvelope>, isBatch: boolean): TFilterResults;
  filterLeads(messages: Array<IUserUpdateEnvelope>): Array<IUserUpdateEnvelope>;
  filterContacts(messages: Array<IUserUpdateEnvelope>): Array<IUserUpdateEnvelope>;
}

export interface IMatchUtil {
  matchHullMessageToSalesforceAccount(message: THullUserUpdateMessage | THullAccountUpdateMessage, sfAccounts: Array<Object>, accountClaims: Array<Object>): Object;
  matchHullMessageToSalesforceRecord(resource: TResourceType, user: THullObject, sfObjects: Array<Object>, identityClaims: Array<Object>): any;
  getIdentityClaimMatches({ entities: Array<Object>, identityClaims: Array<Object>, searchEntity: Object, searchType: string }): Object;
  filterIdentityClaimMatches({ identityClaims: Array<Object>, identityClaimMatches: Object, intersectBy: Object }): Array<Object>;
}

module.exports = {
  SUPPORTED_RESOURCE_TYPES
};

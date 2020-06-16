/* @flow */
import type { THullObject, THullUserUpdateMessage, THullAccountUpdateMessage } from "hull";
import type { TAssignmentRule } from "./service-client/assignmentrules";

// eslint-disable-next-line import/prefer-default-export
export type { THullObject } from "hull";
export type TResourceType = "Lead" | "Contact" | "Account" | "Task";
export type MappingDirection = "outgoing" | "incoming";

const SUPPORTED_RESOURCE_TYPES: Array<TResourceType> = ["Lead", "Contact", "Account"];

export type TResourceTypeAssignmentRule = "Lead" | "Case";

export type TApiMethod = "insert" | "update" | "upsert";

export type TPrivateSettings = {
  privateSettings: Object
}

export type MappedField = {
  name: string,
  source: string,
  type: string,
  readyonly: boolean
}

export type FieldMapping = {
  hull: MappedField,
  service: MappedField,
  direction: MappingDirection
}

export type ServiceObjectDefinition = {
  hull: string,
  service: string
}

export interface IUserUpdateEnvelope {
  message: THullUserUpdateMessage;
}

export interface IAccountUpdateEnvelope {
  message: THullAccountUpdateMessage;
}

export type TDeletedRecordInfo = {
  deletedDate: Date;
  id: string;
}

export type TDeletedRecordsParameters = {
  start: Date;
  end: Date;
}

export type TInsertUpdateOptions = {
  resource: TResourceType;
  leadAssignmentRule?: string;
};

export interface IInsertUpdateOptions {
  resource: TResourceType;
  leadAssignmentRule?: string;
}

export type TApiOperation = {
  method: TApiMethod;
  resource: TResourceType;
  records: Array<Object>;
  externalIDFieldName?: string;
  leadAssignmentRule?: string;
};

export interface IApiResultObject {
  resource: TResourceType;
  method: TApiMethod;
  record: Object;
  success: boolean;
  error: ?string | string[] | null;
}

export interface ILogger {
  log(message: ?any, ...optionalParams: any[]):void;
  info(message: ?any, ...optionalParams: any[]):void;
  warn(message: ?any, ...optionalParams: any[]):void;
  error(message: ?any, ...optionalParams: any[]):void;
  debug(message: ?any, ...optionalParams: any[]):void;
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
  findRecordsById(type: TResourceType, identifiers: string[], fields: string[], accountClaims: Array<Object>, options: Object): Promise<any[]>;
  findRecordById(type: TResourceType, id: string): Promise<any[]>;
  insert(records: Array<THullObject>, options: IInsertUpdateOptions): Promise<IApiResultObject[]>;
  update(records: Array<THullObject>, options: TInsertUpdateOptions): Promise<IApiResultObject[]>;
  fetchFieldsList(type: TResourceType): any;
  fetchResourceSchema(type: TResourceType, fieldTypes: string): any;
  fetchAssignmentRules(type: TResourceTypeAssignmentRule): Promise<TAssignmentRule[]>;
  findLeads(query: any, fieldsList: string[], limit: number, skip: number): Promise<any[]>;
  findContacts(query: any, fieldsList: string[], limit: number, skip: number): Promise<any[]>;
  findAccounts(query: any, fieldsList: string[], limit: number, skip: number): Promise<any[]>;
  queryExistingRecords(type: string, sfdcId: string, recordIds: string[]): Promise<any[]>;
  getAllRecords(type: TResourceType, fields: Array<string>, accountClaims: Array<Object>, onRecord: Function): Promise<*>;
  getUpdatedRecords(type: TResourceType, options: Object, onRecord: Function, concurrency?: number): Promise<*>;
  getDeletedRecords(type: TResourceType, options: Object, onRecord: Function, concurrency: number): Promise<*>;
  getDeletedRecordsData(type: TResourceType, options: TDeletedRecordsParameters): Promise<Array<TDeletedRecordInfo>>;
  exec(fn: string, ...args: any): Promise<any>;
}

export interface IAttributesMapper {
  mapToServiceObject(resource: TResourceType, hullObject: any, segments: Array<Object>, accountSegments: Array<Object>):any;
  mapToHullAttributeObject(resource: TResourceType, sObject: any, resourceSchema: Object):any;
  mapToHullEvent(mappings: Object, resource: TResourceType, sObject: any):any;
  mapToHullIdentObject(resource: TResourceType, sObject: any): any;
  mapToHullDeletedObject(resource: TResourceType, deletedAt: Date): any;
}

module.exports = {
  SUPPORTED_RESOURCE_TYPES
};


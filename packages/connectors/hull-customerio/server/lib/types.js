/* @flow */
import type { HullUserUpdateMessage, HullUser } from "hull";

export type TCustomerIoCustomerAttributeName = string;
export type TCustomerIoCustomerAttributeValue =
  | string
  | number
  | boolean
  | Date
  | Array<string>;

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

export interface IServiceCredentials {
  username: string;
  password: string;
}

export interface IServiceClientOptions {
  logger: ILogger;
  metricsClient: IMetricsClient;
  credentials: IServiceCredentials;
  baseApiUrl: string;
}
export interface IFilterUtilOptions {
  synchronizedSegments: Array<string>;
  segmentPropertyName: string;
  ignoreUsersWithoutEmail: boolean;
  deletionEnabled: boolean;
  synchronizedEvents: Array<string>;
  userAttributeServiceId: string;
}

export interface ICustomerIoEvent {
  name: string;
  data: Object;
  type?: string;
}

export interface IMappingUtilOptions {
  userAttributeServiceId: string;
  userAttributeMappings: Array<string>;
}

export type TCustomerIoCustomer = {
  "customerio/id": string, // required
  "customerio/email"?: string, // recommended
  "customerio/created_at": number, // recommended UNIX timestamp
  [TCustomerIoCustomerAttributeName]: TCustomerIoCustomerAttributeValue // Optional
};

export interface IOperationsUtilOptions {
  segmentPropertyName: string;
}

export interface IValidationUtilOptions {
  maxAttributeNameLength: number;
  maxAttributeValueLength: number;
  maxIdentifierValueLength: number;
}

export type TBusinessValidationResult = {
  isValid: boolean,
  validationErrors: Array<string>
};

export type TConnectorOperationResult = "success" | "error" | "skip";

export type THashAlgorithm = "md5" | "sha1";

export type TFilterResults<T> = {
  toSkip: Array<T>,
  toInsert: Array<T>,
  toUpdate: Array<T>,
  toDelete: Array<T>
};

export type TUserUpdateEnvelope = {
  message: HullUserUpdateMessage,
  hullUser: HullUser,
  customer: TCustomerIoCustomer,
  hash: string,
  customerEvents?: Array<ICustomerIoEvent>,
  customerEventsToSkip?: Array<ICustomerIoEvent>,
  skipReason?: string,
  opsResult?: TConnectorOperationResult
};

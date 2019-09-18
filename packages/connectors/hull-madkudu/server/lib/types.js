/* @flow */
import type {
  THullAccount, THullUserIdent, THullAccountIdent, THullUserUpdateMessage,
  THullAccountUpdateMessage, THullUserAttributes, THullAccountAttributes, THullUser
} from "hull";

/*
 *** Hull Types. Replace when 0.14.0 is released
 */

export type THullMetrics = {
  increment(name: string, value: number, ...params: any[]): void,
  value(name: string, value: number, ...params: any[]): void
};

export type THullClientLogger = {
  log(message: ?any, ...optionalParams: any[]):void;
  info(message: ?any, ...optionalParams: any[]):void;
  warn(message: ?any, ...optionalParams: any[]):void;
  error(message: ?any, ...optionalParams: any[]):void;
  debug(message: ?any, ...optionalParams: any[]):void;
};

export type THullClientConfiguration = {
  prefix: string;
  domain: string;
  protocol: string;
  id: string;
  secret: string;
  organization: string;
  version: string;
};

export type THullClientApiOptions = {
  timeout: number;
  retry: number;
};

export type THullClientUtilTraits = {
  group(user: THullUser | THullAccount): Object;
  normalize(traits: Object): THullUserAttributes;
};

export type THullClientUtils = {
  traits: THullClientUtilTraits
};

export type THullClientTraitsContext = {
  source: string;
};

/**
 * This is an event name which we use when tracking an event
 */
export type THullEventName = string;

/**
 * This is are event's properties which we use when tracking an event
 */
export type THullEventProperties = {
  [HullEventProperty: string]: string
};

/**
 * This is additional context passed with event
 */
export type THullEventContext = {
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

export type THullClient = {
  configuration: THullClientConfiguration;
  asUser(ident: THullUserIdent): THullClient;
  asAccount(ident: THullAccountIdent): THullClient;
  logger: THullClientLogger;
  traits(attributes: THullUserAttributes | THullAccountAttributes, context: THullClientTraitsContext): Promise<any>; // Needs to be refined further
  track(event: string, properties: THullEventProperties, context: THullEventContext): Promise<any>;
  get(url: string, params?: Object, options?: THullClientApiOptions): Promise<any>;
  post(url: string, params?: Object, options?: THullClientApiOptions): Promise<any>;
  put(url: string, params?: Object, options?: THullClientApiOptions): Promise<any>;
  del(url: string, params?: Object, options?: THullClientApiOptions): Promise<any>;
  account(ident: THullAccountIdent): THullClient;
  utils: THullClientUtils;
};


/*
 *** Connector & Madkudu Types
 */
export type TMadkuduAnalyticsEventType = "track" | "page" | "screen";

export type TMadkuduAnalyticsCallType = "identify" | "group" | TMadkuduAnalyticsEventType;

export type TOperationResult = "success" | "error" | "skip";

export type TMadkuduMethod = "companies" | "persons";

export type TServiceClientOptions = {
  logger: THullClientLogger,
  metricsClient: THullMetrics,
  madkuduApiUrl: string,
  madkuduAnalyticsUrl: string,
  hullClient: THullClient, // Replace when THullClient is available
  apiKey: string
};

export type TMadkuduAnalyticsResult = {
  result: TOperationResult,
  type: TMadkuduAnalyticsCallType,
  message?: string,
  response?: any
};

export interface IMadkuduApiResult {
  result: TOperationResult;
  method: TMadkuduMethod;
  message?: string;
  response?: any;
}

export interface IClearbitMappings {
  company: Object;
  person: Object;
}

export type TMadkuduObjectType = "company" | "person";

export type TMadkuduCompanyPropertiesLocation = {
  state: string;
  state_code: string;
  country: string;
  country_code: string;
  tags: Array<string>;
};

export type TMakduduCompanyCustomerFitSignal = {
  name: string;
  value: string | number | Date | boolean | Array<string>;
  type: string;
};

export type TMakduduCompanyCustomerFit = {
  segment: string;
  score: number;
  top_signals: Array<TMakduduCompanyCustomerFitSignal>;
};

export type TMadkuduCompanyProperties = {
  name: string;
  domain: string;
  location: TMadkuduCompanyPropertiesLocation;
  number_of_employees: number;
  industry: string;
  customer_fit?: TMakduduCompanyCustomerFit;
};

export type TMadkuduCompany = {
  domain: string;
  company: TMadkuduCompanyProperties;
};

export type TMadkuduCompanyProfile = {
  object_type: TMadkuduObjectType;
  domain: string;
  properties?: TMadkuduCompanyProperties;
};

export type TAccountUpdateEnvelope = {
  message: THullAccountUpdateMessage,
  company: TMadkuduCompany,
  companyProfile?: TMadkuduCompanyProfile,
  skipReason?: string,
  opsResult?: TOperationResult
};

export type TMadkuduAnalyticsIdentify = {
  userId: string,
  anonymousId: string,
  traits: Object
};

export type TMadkuduAnalyticsGroup = {
  groupId: string,
  userId: string,
  traits: Object
};

export type TMadkuduAnalyticsEvent = {
  type: TMadkuduAnalyticsEventType,
  userId: string,
  anonymousId: string,
  [string]: any
};

export type TUserUpdateEnvelope = {
  message: THullUserUpdateMessage,
  analyticsCalls: Array<{
    analyticsCallType: TMadkuduAnalyticsCallType,
    analyticsCallPayload: TMadkuduAnalyticsGroup | TMadkuduAnalyticsIdentify | TMadkuduAnalyticsEvent
  }>,
  skipReason?: string,
  opsResult?: TOperationResult
};

export type TFilterResults<T> = {
  toSkip: Array<T>,
  toInsert: Array<T>,
  toUpdate: Array<T>,
  toDelete: Array<T>
};

export type TMadkuduConnectorPrivateSettings = {
  api_key: string,
  synchronized_account_segments: Array<string>,
  synchronized_user_segments: Array<string>
};

export type TFilterUtilOptions = {
  synchronizedAccountsSegments: Array<string>,
  segmentAccountPropertyName: string,
  synchronizedUsersSegments: Array<string>
};

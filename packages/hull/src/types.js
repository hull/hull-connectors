// @flow
/* eslint-disable no-use-before-define */
/* :: export type * from "hull-client"; */

import type { Middleware, $Application, Router } from "express";
import type {
  HullSegment,
  HullAccountSegment,
  HullUserSegment,
  HullUser,
  HullEvent,
  HullAccount,
  HullClientConfig,
  HullAttributeName,
  HullAttributeValue
} from "hull-client";

import type { agent } from "superagent";
import type Cache from "./infra/cache/cache-agent";
import type Queue from "./infra/queue/queue-agent";
import type Worker from "./connector/worker";
import type Instrumentation from "./infra/instrumentation/instrumentation-agent";
import { incomingClaims, settingsUpdate, extractRequest } from "./helpers";

export type * from "hull-client";
const Client = require("hull-client");

const ConnectorCache = require("./infra/cache/connector-cache");
const MetricAgent = require("./infra/instrumentation/metric-agent");

export type HullCache = Cache;
export type HullQueue = Queue;
export type HullWorker = Worker;
export type HullInstrumentation = Instrumentation;
export type HullClient = Client;

// IMPORTANT: FOR SPREAD SYNTAX:
// https://github.com/facebook/flow/issues/3534#issuecomment-287580240
// You need to use {...$Exact<Type>} if you want to avoid
// making every field in Type optional

type HTTPMethod =
  | "all"
  | "delete"
  | "get"
  | "patch"
  | "post"
  | "put"
  | "ALL"
  | "DELETE"
  | "GET"
  | "PATCH"
  | "POST"
  | "PUT";

// ====================================
// Manifest Data types
// ====================================
export type HullConnectorSettings = {
  [HullConnectorSettingName: string]: any
};

// ====================================
//   Notification+Batch Handler Configuration
// ====================================
export type HandlerCacheOptions = {
  key?: string,
  options?: Object
};
export type HullNotificationHandlerOptions = {
  disableErrorHandling?: boolean,
  maxTime?: number,
  filter?: {
    user_segments?: string,
    account_segments?: string
  },
  maxSize?: number
};
export type HullBatchHandlerOptions = {
  disableErrorHandling?: boolean,
  maxSize?: number
};
export type HullIncomingHandlerOptions = {
  // fetchShip?: boolean,
  // cacheShip?: boolean,
  type?: "router" | "OAuth" | "oauth",
  params?: HullOAuthHandlerOptions | {},
  cache?: HandlerCacheOptions,
  respondWithError?: boolean,
  disableErrorHandling?: boolean,
  fireAndForget?: boolean,
  credentialsFromQuery?: boolean,
  credentialsFromNotification?: boolean,
  strict?: boolean,
  format?: "json" | "html",
  bodyParser?: "urlencoded" | "json"
};
export type HullStatusHandlerOptions = HullIncomingHandlerOptions & {};
export type HullSchedulerHandlerOptions = HullIncomingHandlerOptions & {};
export type HullHtmlHandlerOptions = HullIncomingHandlerOptions & {};
export type HullJsonHandlerOptions = HullIncomingHandlerOptions & {};

type HullNotificationHandlerChannel =
  | "user:update"
  | "user:delete"
  | "account:update"
  | "users_segment:update"
  | "users_segment:delete"
  | "accounts_segment:update"
  | "accounts_segment:delete"
  | "ship:update";
type HullBatchHandlerChannel = HullNotificationHandlerChannel;

// A Manifest Notification block. Defines a route for Hull to send Notifications to.
type HullManifestNotification = {
  url: string,
  channels: Array<{
    handler: "string",
    channel: HullNotificationHandlerChannel,
    options: HullNotificationHandlerOptions
  }>
};

// A Manifest Batch block. Defines a route for Hull to send Notifications to.
type HullManifestBatch = {
  url: string,
  channels: Array<{
    handler: "string",
    channel: HullBatchHandlerChannel,
    options: HullBatchHandlerOptions
  }>
};

// A Manifest Schedule block. Defines a schedule for Hull to ping the connector
type HullManifestSchedule = {
  url: string,
  handler: string,
  interval: string,
  method: HTTPMethod,
  options?: HullSchedulerHandlerOptions
};
// A Manifest Status block. Defines a schedule for Hull to ping the connector
type HullManifestStatus = {
  url: string,
  handler: string,
  interval: string,
  method: HTTPMethod,
  options?: HullStatusHandlerOptions
};

// A Manifest Endpoint block. Defines a publicly-available route for the Connector to receive Service data

type HullManifestJsonConfig = {
  url: string,
  handler: string,
  method: HTTPMethod,
  options?: HullIncomingHandlerOptions
};

type HullManifestIncomingConfig = {
  url: string,
  handler: string,
  method: HTTPMethod,
  options?: HullIncomingHandlerOptions
};

// A Manifest Tab config. Defines a route to display a screen in the Dashboard
type HullManifestHtmlConfig = {
  title: string,
  url: string,
  size: "small" | "large",
  editable: boolean,
  handler: string,
  method: HTTPMethod,
  options?: HullHtmlHandlerOptions
};

type HullOAuthCredentialsConfig = {
  title: string,
  url?: string,
  status?: string,
  handler: string,
  options: HullOAuthHandlerOptions
};
// Connector Manifest. Defines a Connector's exposed endpoints and features

type HullManifestSetting = {
  [string]: any
};

export type HullManifest = {
  name: string,
  description: string,
  tags: Array<"batch" | "batch-accounts" | "kraken">,
  source: string,
  logo: string,
  picture: string,
  readme: string,
  version: string,
  deployment_settings: Array<HullManifestSetting>,
  settings?: Array<HullManifestSetting>,
  private_settings?: Array<HullManifestSetting>,

  batches?: Array<HullManifestBatch>,
  subscriptions?: Array<HullManifestNotification>,

  credentials?: Array<HullOAuthCredentialsConfig>,
  tabs?: Array<HullManifestHtmlConfig>,
  html?: Array<HullManifestHtmlConfig>,

  incoming?: Array<HullManifestIncomingConfig>,
  json?: Array<HullManifestJsonConfig>,
  statuses?: Array<HullManifestStatus>,
  schedules?: Array<HullManifestSchedule>
};

// =====================================
// Hull Connector Data Object
// =====================================
export type HullConnector = {
  id: string,
  updated_at: string,
  created_at: string,
  name: string,
  description: string,
  tags: Array<string>,
  source_url: string,
  index: string,
  picture: string,
  homepage_url: string,
  manifest_url: string,
  manifest: HullManifest,
  settings: HullConnectorSettings,
  private_settings: HullConnectorSettings,
  status: Object
};

// =====================================
//    Connector Data Types
// =====================================

export type HullMetric =
  | ["value", string, number, Array<string>]
  | ["increment", string, number, Array<string>];

// =====================================
//   Connector Configuration
// =====================================

export type HullJsonConfig = {
  inflate?: boolean,
  reviver?: Function,
  limit?: string,
  strict?: boolean,
  type?: string | Function,
  verify?: Function
};
export type HullHTTPClientConfig = {
  timeout?:
    | number
    | {
        deadline: number,
        response: number
      },
  retries?: number,
  prefix?: string,
  throttle?:
    | false
    | {
        rate?: number,
        ratePer?: number,
        concurrent?: number
      }
};
export type HullServerConfig = {
  start?: boolean
};
export type HullWorkerConfig = {
  start?: boolean,
  queueName?: string
};
export type HullMetricsConfig = {
  captureMetrics?: Array<HullMetric>,
  exitOnError?: boolean
};
export type HullLogsConfig = {
  logLevel?: ?string
};
export type HullCacheConfig =
  | {
      store: "memory",
      ttl?: number | string,
      max?: number | string,
      min?: number | string
    }
  | {
      store: "redis",
      url: string,
      ttl?: number | string,
      max?: number | string,
      min?: numbe | stringr
    };
export type HullClientCredentials = {
  id: string,
  secret: string,
  organization: string
};
export type HullConnectorConfig = {
  clientConfig: HullClientConfig,
  serverConfig?: HullServerConfig,
  workerConfig?: HullWorkerConfig,
  metricsConfig?: HullMetricsConfig,
  cacheConfig?: HullCacheConfig,
  httpClientConfig?: HullHTTPClientConfig,
  logsConfig?: HullLogsConfig,
  hostSecret: string,
  port: number | string,
  connectorName?: string,
  segmentFilterSetting?: any,
  skipSignatureValidation?: boolean,
  timeout?: number | string,
  disableOnExit?: boolean,
  devMode?: boolean,
  json?: HullJsonConfig,
  instrumentation?: Instrumentation,
  queue?: void | Queue,
  handlers:
    | HullHandlersConfiguration
    | (HullConnector => HullHandlersConfiguration),
  notificationValidatorHttpClient?: Object,
  middlewares: Array<Middleware>,
  manifest: HullManifest
  // $FlowFixMe
  // handlers: HullHandlers // eslint-disable-line no-use-before-define
};

// =====================================
//   Hull Context
// =====================================

export type HullContextBase = {
  requestId?: string, // request id
  hostname: string, // req.hostname
  options: Object, // req.query
  isBatch: boolean,
  HullClient: Class<Client>,

  connectorConfig: HullConnectorConfig, // configuration passed to Hull.Connector
  clientConfig: HullClientConfig, // configuration which will be applied to Hull Client

  cache: ConnectorCache,
  metric: MetricAgent,
  enqueue: (
    // queueAdapter: Object,
    // // eslint-disable-next-line no-use-before-define
    // ctx: HullContext,
    jobName: string,
    jobPayload?: Object,
    options?: Object
  ) => Promise<*>,

  token?: string,
  clientCredentials?: HullClientCredentials, // HullClient credentials
  clientCredentialsToken?: string, // signed (not encrypted) jwt token with HullClient credentials
  clientCredentialsEncryptedToken?: string // encrypted token with HullClient credentials
};
export type HullContext = {
  /**
   * Context added to the express app request by hull-node connector sdk.
   * Accessible via `req.hull` param.
   * @public
   * @memberof Types
   */
  ...$Exact<HullContextBase>,
  handlerName?: string,
  clientCredentials: HullClientCredentials, // HullClient configuration
  // clientCredentialsToken?: string,
  clientCredentialsToken: string,
  clientCredentialsEncryptedToken: string,
  // connector?: HullConnector,
  connector: HullConnector,
  // usersSegments?: Array<HullSegment>,
  // accountsSegments?: Array<HullSegment>
  usersSegments: Array<HullUserSegment>,
  accountsSegments: Array<HullAccountSegment>,
  client: Client,
  notification?: HullNotification,
  connector: HullConnector,
  authParams?: {},
  // @TODO => refine Superagent signature
  request: agent,
  helpers: {
    settingsUpdate: $Call<typeof settingsUpdate, HullContext>,
    incomingClaims: $Call<typeof incomingClaims, HullContext>,
    extractRequest: $Call<typeof extractRequest, HullContext>
  }
};

// =====================================
//   Handlers Requests
// =====================================

// Should disappear in the future to be replaced with a unified ctx, message signature
declare class $HullRequest extends express$Request {
  /*
   * Since Hull Middleware adds new parameter to the Request object from express application
   * we are providing an extended type to allow using HullReqContext
   * @public
   * @memberof Types
   */
  hull: HullContext;
}
export type HullRequest = $HullRequest;
type HullOAuthAccount = {
  refreshToken?: string,
  accessToken?: string,
  [string]: any
};
export type HullOAuthRequest = HullRequest & {
  account?: HullOAuthAccount,
  authParams?: {}
};

export type HullOauthAuthorizeMessage = {
  ...$Exact<HullIncomingHandlerMessage>,
  account?: HullOAuthAccount
};

// Hull Notification
// declare class $NotificationBody {
//   body: HullNotification;
// }
// declare class $HullNotificationRequest extends $HullRequest
//   mixins $NotificationBody {}
// export type HullNotificationRequest = $HullNotificationRequest;

// ====================================
//   Notification DataTypes
// ====================================
/**
 * Attributes (traits) changes is an object map where keys are attribute (trait) names and value is an array
 * where first element is an old value and second element is the new value.
 * This object contain information about changes on one or multiple attributes (that's thy attributes and changes are plural).
 */
export type HullAttributesChanges = {|
  [HullAttributeName]: [HullAttributeValue, HullAttributeValue]
|};

/**
 * Represents segment changes in TUserChanges.
 * The object contains two params which mark which segments user left or entered.
 * It may contain none, one or multiple HullSegment in both params.
 */
export type HullSegmentsChanges = {
  entered?: Array<HullSegment>,
  left?: Array<HullSegment>
};

/**
 * Object containing all changes related to User in HullUserUpdateMessage
 */
export type HullUserChanges = {
  is_new: boolean,
  user: HullAttributesChanges,
  account: HullAttributesChanges,
  segments: HullSegmentsChanges, // should be segments or user_segments?
  account_segments: HullSegmentsChanges
};

/**
 * Object containing all changes related to Account in HullUserUpdateMessage
 */
export type HullAccountChanges = {
  is_new: boolean,
  account: HullAttributesChanges,
  account_segments: HullSegmentsChanges
};

/**
 * A message sent by the platform when any event, attribute (trait) or segment change happens on the user.
 */
export type HullUserUpdateMessage = {
  message_id: string,
  user: HullUser,
  changes: HullUserChanges,
  segments: Array<HullUserSegment>,
  segment_ids: Array<string>,
  user_segments: Array<HullUserSegment>,
  user_segment_ids: Array<string>,
  matching_user_segments: Array<HullUserSegment>,
  account_segments: Array<HullAccountSegment>,
  account_segment_ids: Array<string>,
  matching_account_segments: Array<HullUserSegment>,
  events: Array<HullEvent>,
  account: HullAccount
};
export type HullUserDeleteMessage = {};

/**
 * A message sent by the platform when any attribute (trait) or segment change happens on the account.
 */
export type HullAccountUpdateMessage = {
  changes: HullAccountChanges,
  account_segments: Array<HullAccountSegment>,
  account_segment_ids: Array<string>,
  matching_account_segments: Array<HullUserSegment>,
  account: HullAccount,
  message_id: string
};
export type HullAccountDeleteMessage = {};

/**
 * A message sent by the platform when a Segment is updated
 */
export type HullSegmentUpdateMessage = {|
  id: string,
  name: string,
  created_at: string,
  updated_at: string,
  message_id: string
|};
export type HullUserSegmentUpdateMessage = HullSegmentUpdateMessage & {|
  type: "users_segment"
|};
export type HullAccountSegmentUpdateMessage = HullSegmentUpdateMessage & {|
  type: "accounts_segment"
|};
export type HullUserSegmentDeleteMessage = HullSegmentUpdateMessage & {|
  type: "users_segment"
|};
export type HullAccountSegmentDeleteMessage = HullSegmentUpdateMessage & {|
  type: "accounts_segment"
|};
export type HullSegmentDeleteMessage = {|
  id: string,
  name: string,
  type: "users_segment" | "accounts_segment",
  created_at: string,
  updated_at: string
|};

/**
 * A message sent by the platform when a Segment is updated
 */
export type HullConnectorUpdateMessage = {|
  ...$Exact<HullConnector>,
  secret: string
|};
export type HullConnectorDeleteMessage = {|
  ...$Exact<HullConnector>,
  secret: string
|};

/**
 * The whole notification object
 */
export type HullNotification = {
  configuration: {
    id: string,
    secret: string,
    organization: string
  },
  channel: string,
  connector: HullConnector,
  segments: Array<HullUserSegment>,
  accounts_segments: Array<HullAccountSegment>,
  messages?: Array<HullUserUpdateMessage> | Array<HullAccountUpdateMessage>,
  notification_id: string
};

// =====================================
//   Handler Responses
// =====================================

// Should disappear in the future to be replaced with a function return instead.
// declare class $HullResponse extends express$Response {}
export type HullResponse = express$Response;

// === Notification Handler response
export type HullNotificationFlowControl = {
  type: "next" | "retry",
  size?: number,
  in?: number,
  in_time?: number
};

export type HullKrakenResponse = void | {|
  action: "success" | "skip" | "error",
  type: "user" | "account" | "event",
  message_id?: string,
  message?: string,
  id: ?string,
  data: {}
|};

export type HullNotificationResponseData = void | {
  flow_control?: HullNotificationFlowControl,
  responses?: Array<?HullKrakenResponse>
};
export type HullNotificationResponse =
  | HullNotificationResponseData
  | Promise<HullNotificationResponseData>;

export type HullExternalResponseData = void | {
  status?: number,
  pageLocation?: string,
  data?: any,
  text?: string
};
export type HullExternalResponse =
  | HullExternalResponseData
  | Promise<HullExternalResponseData>;

export type HullOAuthAuthorizeResponseData = void | {
  private_settings?: {}
};
export type HullOAuthAuthorizeResponse = void | Promise<HullOAuthAuthorizeResponseData>;

export type HullCredentialsStatusResponseData = void | {
  status: number,
  data: {
    message: string,
    html?: string
  }
};
export type HullCredentialsStatusResponse = void | Promise<HullCredentialsStatusResponseData>;

export type HullStatusResponseData =
  | {
      status: "ok" | "warning" | "error" | "setupRequired",
      messages: Array<string>
    }
  | {
      status: "ok" | "warning" | "error" | "setupRequired",
      message: string
    };

export type HullStatusResponse =
  | HullStatusResponseData
  | Promise<HullStatusResponseData>;

// ====================================
//   Handler functions
// ====================================
export type HullUserUpdateCallback = (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
) => HullNotificationResponse;

export type HullUserDeleteCallback = (
  ctx: HullContext,
  messages: Array<HullUserDeleteMessage>
) => HullNotificationResponse;

export type HullAccountUpdateCallback = (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
) => HullNotificationResponse;

export type HullAccountDeleteCallback = (
  ctx: HullContext,
  messages: Array<HullAccountDeleteMessage>
) => HullNotificationResponse;

export type HullUserSegmentUpdateCallback = (
  ctx: HullContext,
  messages: Array<HullUserSegment>
) => HullNotificationResponse;

export type HullUserSegmentDeleteCallback = (
  ctx: HullContext,
  message: HullUserSegment
) => HullNotificationResponse;

export type HullAccountSegmentUpdateCallback = (
  ctx: HullContext,
  messages: Array<HullAccountSegment>
) => HullNotificationResponse;

export type HullAccountSegmentDeleteCallback = (
  ctx: HullContext,
  message: HullAccountSegment
) => HullNotificationResponse;

export type HullConnectorUpdateCallback = (
  ctx: HullContext,
  messages?: HullConnectorUpdateMessage
) => HullNotificationResponse;

export type HullNotificationHandlerCallback =
  | HullConnectorUpdateCallback
  | HullUserUpdateCallback
  | HullUserDeleteCallback
  | HullAccountUpdateCallback
  | HullAccountDeleteCallback
  | HullUserSegmentUpdateCallback
  | HullUserSegmentDeleteCallback
  | HullAccountSegmentUpdateCallback
  | HullAccountSegmentDeleteCallback;

export type HullBatchHandlerCallback = HullNotificationHandlerCallback;
export type HullStatusHandlerCallback = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) => HullStatusResponse;

// ====================================
//   Incoming request handlers - everything that doesn't come from Kraken or Batch
// ====================================
// @TODO: evolve this introducing envelope etc.
// === External Handler request. for use in (ctx, message: HullIncomingHandlerMessage) signatures
type HandlerMap = { [string]: any };

export type HullIncomingHandlerMessage = {|
  ip: string,
  url: string,
  method: string,
  protocol: string,
  hostname: string,
  path: string,
  params: HandlerMap,
  query: HandlerMap,
  headers: HandlerMap,
  cookies: HandlerMap,
  body?: {}
|};

export type HullSendResponse = Promise<*>;
export type HullSyncResponse = Promise<*>;
export type HullIncomingHandlerCallback = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage,
  res: HullResponse
) => HullExternalResponse;
export type HullSchedulerHandlerCallback = HullIncomingHandlerCallback;
export type HullHtmlHandlerCallback = HullIncomingHandlerCallback;
export type HullOAuthHandlerParams = void | {
  onAuthorize?: (
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
  ) => HullOAuthAuthorizeResponse,
  onStatus?: (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ) => HullStatusResponse,
  onLogin?: (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ) => HullExternalResponse,
  Strategy: any,
  clientID: string,
  clientSecret: string
};
export type HullOAuthHandlerOptions = {
  name: string,
  tokenInUrl?: boolean,
  strategy: {
    authorizationURL: string,
    tokenURL: string,
    grant_type: string,
    scope: Array<string>
  }
};
export type HullOAuthHandlerCallback = () => void | HullOAuthHandlerParams;
export type HullJsonHandlerCallback = HullIncomingHandlerCallback;

// =====================================
//   Middleware params types
// =====================================
export type HullBaseMiddlewareParams = {
  Client: Class<Client>,
  queue: Queue,
  cache: Cache,
  instrumentation: Instrumentation,
  connectorConfig: HullConnectorConfig
};
export type HullContextMiddlewareParams = {
  requestName?: string,
  type?: "notification" | "query"
};

// ============================
// OOP types
// ============================
export interface HullSyncAgent {
  constructor(ctx: HullContext): void;
  sendUserUpdateMessages(
    messages: Array<HullUserUpdateMessage>
  ): HullSendResponse;
  sendAccountUpdateMessages(
    messages: Array<HullAccountUpdateMessage>
  ): HullSendResponse;
  syncConnectorUpdateMessage(): HullSyncResponse;
  syncSegmentUpdateMessage(): HullSyncResponse;
}
export type HullServerFunction = (
  app: $Application,
  extra?: Object
) => $Application;

/* Configurable Claims */

export type HullConnectorSettingsTraitMapping = Array<{
  hull?: string,
  service?: string,
  name?: string,
  overwrite?: boolean
}>;

export type HullIncomingClaimsSetting = {
  hull?: string,
  service?: string,
  required?: boolean
};

type RouterFactory = any => Router;
export type HullHandlersConfiguration = {
  jobs?: { [string]: any },
  subscriptions?: { [string]: HullNotificationHandlerCallback },
  batches?: { [string]: HullBatchHandlerCallback },
  tabs?: {
    [string]: HullHtmlHandlerCallback | HullOAuthHandlerCallback | RouterFactory
  },
  statuses?: { [string]: HullStatusHandlerCallback },
  schedules?: { [string]: HullSchedulerHandlerCallback },
  json?: { [string]: HullJsonHandlerCallback },
  incoming?: { [string]: HullIncomingHandlerCallback }
};

/* CONFIGURATION ENTRIES - for internal use*/
export type Handler<HNC, HNO> = {
  method?: HTTPMethod,
  callback: HNC,
  options?: HNO
};
export type HullHtmlHandlerConfigurationEntry = Handler<
  HullHtmlHandlerCallback,
  HullHtmlHandlerOptions
>;
export type HullJsonHandlerConfigurationEntry = Handler<
  HullJsonHandlerCallback,
  HullJsonHandlerOptions
>;
export type HullSchedulerHandlerConfigurationEntry = Handler<
  HullSchedulerHandlerCallback,
  HullSchedulerHandlerOptions
>;
export type HullBatchHandlersConfigurationEntry = Handler<
  HullBatchHandlerCallback,
  HullBatchHandlerOptions
>;
export type HullIncomingHandlerConfigurationEntry = Handler<
  HullIncomingHandlerCallback,
  HullIncomingHandlerOptions
>;
export type HullStatusHandlerConfigurationEntry = Handler<
  HullStatusHandlerCallback,
  HullStatusHandlerOptions
>;
export type HullNotificationHandlerConfiguration = Array<{
  callback: HullNotificationHandlerCallback,
  channel: HullNotificationHandlerChannel,
  options: HullNotificationHandlerOptions
}>;
export type HullBatchHandlersConfiguration = Array<{
  callback: HullBatchHandlerCallback,
  channel: HullBatchHandlerChannel,
  options: HullBatchHandlerOptions
}>;

type ExpressMethod = "use" | HTTPMethod;
export type HullRouteMap = {
  router: Router,
  method: ExpressMethod
};

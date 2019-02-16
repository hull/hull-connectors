// @flow
/* :: export type * from "hull-client"; */

import type { Middleware, $Request, $Application } from "express";
import type {
  HullSegment,
  HullManifest,
  HullNotification,
  HullConnector,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullUserDeleteMessage,
  HullAccountDeleteMessage,
  HullSegmentUpdateMessage,
  HullSegmentDeleteMessage,
  HullConnectorUpdateMessage,
  HullClientConfig,
  HullNotificationHandlerOptions,
  HullSchedulerHandlerOptions,
  HullExternalHandlerOptions
} from "hull-client";

import type { Connector as ConnectorEngine } from "./index";
import type Cache from "./infra/cache/cache-agent";
import type Queue from "./infra/queue/queue-agent";
import type Worker from "./connector/worker";
import type Instrumentation from "./infra/instrumentation/instrumentation-agent";

export type * from "hull-client";
const Client = require("hull-client");

const ConnectorCache = require("./infra/cache/connector-cache");
const MetricAgent = require("./infra/instrumentation/metric-agent");

export type HullFramework = {|
  Client: Client,
  Connector: Class<ConnectorEngine>
|};
export type HullCache = Cache;
export type HullQueue = Queue;
export type HullWorker = Worker;
export type HullInstrumentation = Instrumentation;

// IMPORTANT: FOR SPREAD SYNTAX:
// https://github.com/facebook/flow/issues/3534#issuecomment-287580240

/**
 * @module Types
 */

export type HullClient = Client;

export type JsonConfig = {
  inflate?: boolean,
  limit?: string,
  reviver?: Function,
  strict?: boolean,
  type?: string | Function,
  verify?: Function
};

export type HullServerConfig = {
  start?: boolean
};

export type HullWorkerConfig = {
  start?: boolean,
  queueName?: string | null
};

export type HullMetric =
  | ["value", string, number, Array<string>]
  | ["increment", string, number, Array<string>];

export type HullMetricsConfig = {
  captureMetrics?: Array<HullMetric>,
  exitOnError?: boolean
};

export type HullLogsConfig = {
  captureLogs?: boolean,
  logLevel?: ?string
};

export type HullConnectorConfig = {
  clientConfig: HullClientConfig,
  serverConfig?: HullServerConfig,
  workerConfig?: HullWorkerConfig,
  metricsConfig?: HullMetricsConfig,
  logsConfig?: HullLogsConfig,
  hostSecret: ?string,
  port: number | string,
  connectorName?: string,
  segmentFilterSetting?: any,
  skipSignatureValidation?: boolean,
  timeout?: number | string,
  captureLogs?: Array<any>,
  disableOnExit?: boolean,
  devMode?: boolean,
  json?: JsonConfig,
  instrumentation?: Instrumentation,
  cache?: Cache,
  queue?: Queue,
  notificationValidatorHttpClient?: Object,
  middlewares: Array<Middleware>,
  manifest: HullManifest
  // $FlowFixMe
  // handlers: HullHandlers // eslint-disable-line no-use-before-define
};

export type HullCacheOptions = {
  ttl?: number,
  max?: number,
  store?: string
};
export type HullClientCredentials = {
  id: $PropertyType<HullClientConfig, "id">,
  secret: $PropertyType<HullClientConfig, "secret">,
  organization: $PropertyType<HullClientConfig, "organization">
};

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
    queueAdapter: Object,
    // eslint-disable-next-line no-use-before-define
    ctx: HullContextFull,
    jobName: string,
    jobPayload: Object,
    options?: Object
  ) => Promise<*>,

  token?: string,
  clientCredentials?: HullClientCredentials, // HullClient credentials
  clientCredentialsToken?: string // encrypted token with HullClient credentials
};

export type HullContextWithCredentials = {
  ...$Exact<HullContextBase>,
  clientCredentials: HullClientCredentials, // HullClient configuration
  clientCredentialsToken?: string,

  connector?: HullConnector,
  usersSegments?: Array<HullSegment>,
  accountsSegments?: Array<HullSegment>
};

export type HullContextWithClient = {
  ...$Exact<HullContextWithCredentials>,
  clientCredentialsToken: string,
  client: Client,
  notification?: HullNotification
};

export type HullNotificationFlowControl = {
  type: "next" | "retry",
  size: number,
  in: number,
  in_time: number
};

export type HullMessageResponse = {|
  message_id?: string,
  action: "success" | "skip" | "error",
  type: "user" | "account" | "event",
  message?: string,
  id: ?string,
  data: {}
|};

export type HullBaseMiddlewareParams = {
  Client: Class<HullClient>,
  queue: Queue,
  cache: Cache,
  instrumentation: Instrumentation,
  connectorConfig: HullConnectorConfig
};

export type HullContextMiddlewareParams = {
  requestName?: string,
  type?: "notification" | "query"
};

export type HullNotificationResponse = Promise<void | {
  flow_control?: HullNotificationFlowControl,
  responses?: Array<?HullMessageResponse>
}>;

export type HullExternalResponse = Promise<any>;

/**
 * Context added to the express app request by hull-node connector sdk.
 * Accessible via `req.hull` param.
 * @public
 * @memberof Types
 */
export type HullContextFull = {
  ...$Exact<HullContextWithClient>,
  connector: HullConnector,
  usersSegments: Array<HullSegment>,
  accountsSegments: Array<HullSegment>,

  notification?: HullNotification,
  handlerName?: string
};

export type HullContext<Connector: HullConnector> = {
  ...$Exact<HullContextFull>,
  connector: Connector
};

// export type HullRequestBase =
export type HullRequestBase = $Request & {
  headers: {
    [string]: string
  },
  hostSecret: string,
  hull: HullContextBase
};

export type HullRequestWithCredentials = {
  ...$Request,
  headers: {
    [string]: string
  },
  hull: HullContextWithCredentials
};

export type HullRequestWithClient = {
  ...$Request,
  headers: {
    [string]: string
  },
  hull: HullContextWithClient
};

/*
 * Since Hull Middleware adds new parameter to the Request object from express application
 * we are providing an extended type to allow using HullReqContext
 * @public
 * @memberof Types
 */
export type HullExpressRequest = $Request & {
  hull: HullContextFull
};

export type HullRequestFull = HullExpressRequest;

export type HullRequest<Context> = {
  ...$Request,
  hull: Context
};

// TODO: evolve this introducing envelope etc.
export type HullSendResponse = Promise<*>;
export type HullSyncResponse = Promise<*>;

// OOP types
export interface HullSyncAgent {
  constructor(ctx: HullContextFull): void;
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

// functional types

type HandlerMap = {
  [string]: any
};

/* Preformatted message generated from an incoming request */
export type HullExternalHandlerMessage = {
  ip: string,
  url: string,
  method: string,
  protocol: string,
  hostname: string,
  path: string,
  params: HandlerMap | Array<string>,
  query: HandlerMap,
  headers: HandlerMap,
  cookies: HandlerMap,
  body?: any
};
export type HullExternalHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullExternalHandlerMessage>
) => HullExternalResponse;

/* User Handlers */
export type HullUserUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullUserUpdateMessage>
) => HullNotificationResponse;
export type HullUserDeleteHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullUserDeleteMessage>
) => HullNotificationResponse;

/* Account Handlers */
export type HullAccountUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullAccountUpdateMessage>
) => HullNotificationResponse;
export type HullAccountDeleteHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullAccountDeleteMessage>
) => HullNotificationResponse;

/* Segment Handlers */
export type HullSegmentUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullSegmentUpdateMessage>
) => HullNotificationResponse;
export type HullSegmentDeleteHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullSegmentDeleteMessage>
) => HullNotificationResponse;

/* TODO: Evolve contract so that these input and return values are correct */
export type HullConnectorUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages?: Array<HullConnectorUpdateMessage>
) => HullNotificationResponse;

export type HullNotificationHandlerCallback =
  | HullConnectorUpdateHandlerCallback
  | HullUserUpdateHandlerCallback
  | HullUserDeleteHandlerCallback
  | HullAccountUpdateHandlerCallback
  | HullAccountDeleteHandlerCallback
  | HullSegmentUpdateHandlerCallback
  | HullSegmentDeleteHandlerCallback;

export type HullNotificationHandlerConfigurationEntry<HNC, HNO> = {
  callback: HNC,
  options?: HNO
};

export type HullNotificationHandlerConfiguration = {
  "user:update"?: HullNotificationHandlerConfigurationEntry<
    HullUserUpdateHandlerCallback,
    HullNotificationHandlerOptions
  >,
  "user:delete"?: HullNotificationHandlerConfigurationEntry<
    HullUserDeleteHandlerCallback,
    HullNotificationHandlerOptions
  >,
  "account:update"?: HullNotificationHandlerConfigurationEntry<
    HullAccountUpdateHandlerCallback,
    HullNotificationHandlerOptions
  >,
  "segment:update"?: HullNotificationHandlerConfigurationEntry<
    HullSegmentUpdateHandlerCallback,
    HullNotificationHandlerOptions
  >,
  "ship:update"?: HullNotificationHandlerConfigurationEntry<
    HullConnectorUpdateHandlerCallback,
    HullNotificationHandlerOptions
  >,
  [HullChannelName: string]: HullNotificationHandlerConfigurationEntry<
    HullNotificationHandlerCallback,
    HullNotificationHandlerOptions
  >
};

/* Batch Handlers */
export type HullBatchHandlerOptions = {
  maxSize?: number
};

export type HullBatchHandlerConfigurationEntry = {
  callback: HullNotificationHandlerCallback,
  options?: HullBatchHandlerOptions
};
export type HullBatchHandlersConfiguration = {
  [HullChannelName: string]: HullBatchHandlerConfigurationEntry
};

/* External handlers */
export type HullStatusHandlerCallback = HullExternalHandlerCallback;

export type HullHandlers = {
  [handlerName: string]:
    | HullExternalHandlerCallback
    | HullNotificationHandlerCallback
};

export type HullExternalHandlerConfigurationEntry = {
  callback: HullExternalHandlerCallback,
  options?: HullExternalHandlerOptions
};

export type HullSchedulerHandlerCallback = (
  ctx: HullContextFull
) => HullExternalResponse;

/* schedulerHandler */
export type HullSchedulerHandlerConfigurationEntry = {
  callback: HullSchedulerHandlerCallback,
  options?: HullSchedulerHandlerOptions
};

export type HullJsonHandlerCallback = (ctx: HullContextFull) => Promise<*>;

export type HullJsonHandlerOptions = {
  cache?: {
    key?: string,
    options?: Object
  },
  fireAndForget?: boolean,
  disableErrorHandling?: boolean,
  respondWithError?: boolean
};

export type HullJsonHandlerConfigurationEntry = {
  callback: HullJsonHandlerCallback,
  options: HullJsonHandlerOptions
};

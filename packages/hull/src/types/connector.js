// @flow

import type { Middleware } from "express";
import type {
  HullManifest,
  HullConnectorSettings,
  HullClientConfig,
  HullHandlersConfiguration,
  HullContext,
  HullInstrumentation,
  HullQueue
} from "./index";
// =====================================
// Hull Connector Data Object
// =====================================

export type HullConnector = {|
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
  accept_incoming_webhooks?: boolean,
  settings: HullConnectorSettings,
  private_settings: HullConnectorSettings,
  status: Object
|};

// =====================================
//   Connector Configuration
// =====================================

export type HullJsonConfig = {
  inflate?: boolean,
  reviver?: Function,
  limit?: string | number,
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

export type HullMetric =
  | ["value", string, number, Array<string>]
  | ["increment", string, number, Array<string>];

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
      isCacheableValue?: () => boolean,
      ttl?: number | string,
      max?: number | string,
      min?: number | string
    }
  | {
      store: "redis",
      isCacheableValue?: () => boolean,
      url: string,
      ttl?: number | string,
      max?: number | string,
      min?: number | string
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
  jsonConfig?: HullJsonConfig,
  hostSecret: string,
  port: number | string,
  connectorName?: string,
  skipSignatureValidation?: boolean,
  timeout?: number | string,
  disableOnExit?: boolean,
  devMode?: boolean,
  instrumentation?: HullInstrumentation,
  queue?: void | HullQueue,
  handlers:
    | HullHandlersConfiguration
    | (HullConnector => HullHandlersConfiguration),
  notificationValidatorHttpClient?: Object,
  middlewares: Array<Middleware>,
  manifest: HullManifest
  // handlers: HullHandlers // eslint-disable-line no-use-before-define
};

export type HullCredentialsObject = {|
  token?: string,
  clientCredentials?: HullClientCredentials, // HullClient credentials
  clientCredentialsToken?: string, // signed (not encrypted) jwt token with HullClient credentials
  clientCredentialsEncryptedToken?: string // encrypted token with HullClient credentials
|};
export type HullContextGetter = HullCredentialsObject => Promise<HullContext>;

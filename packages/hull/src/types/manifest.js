// @flow
import type { HTTPMethod } from "./index";

// Supported Dashboard widget types
type HullWidgetFormat = "popup" | "credentials" | "action";

// ====================================
// Manifest Data types
// ====================================

// ====================================
//   Notification+Batch Handler Configuration
// ====================================
export type HandlerCacheOptions = {
  key?: string,
  options?: Object
};

export type HullExtendedMiddlewareParams = {
  bodyParser?: "urlencoded" | "json",
  credentialsFromQuery?: boolean,
  credentialsFromNotification?: boolean,
  cache?: HandlerCacheOptions,
  respondWithError?: boolean,
  cacheContextFetch?: boolean,
  disableErrorHandling?: boolean,
  fireAndForget?: boolean,
  strict?: boolean,
  format?: "json" | "html"
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
  ...$Exact<HullExtendedMiddlewareParams>
};
export type HullStatusHandlerOptions = HullIncomingHandlerOptions & {};
export type HullSchedulerHandlerOptions = HullIncomingHandlerOptions & {};
export type HullHtmlHandlerOptions = HullIncomingHandlerOptions & {};
export type HullJsonHandlerOptions = HullIncomingHandlerOptions & {};

type HullActionConfirmOption = {
  action: "fetch",
  text?: string,
  button?: string,
  entity: "users" | "accounts"
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

type HullManifestJsonConfig =
  | {
      url: string,
      handler: string,
      method: HTTPMethod,
      options?: HullIncomingHandlerOptions & {
        confirm?: HullActionConfirmOption
      }
    }
  | {
      url: string,
      handler: string,
      method: HTTPMethod,

      name: string,
      title: string,
      description?: string,
      format: HullWidgetFormat,
      options?: HullIncomingHandlerOptions & {
        confirm?: HullActionConfirmOption
      }
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

// type HullOAuthCredentialsConfig = {
//   title: string,
//   url?: string,
//   status?: string,
//   handler: string,
//   options: HullOAuthHandlerOptions
// };
// Connector Manifest. Defines a Connector's exposed endpoints and features

export type HullManifestSetting = {
  type: string,
  name: string,
  format: string,
  handler?: string,
  url?: string,
  options?: {
    loadOptions?: string
  }
};

export type HullNotificationHandlerChannel =
  | "user:update"
  | "user:delete"
  | "account:update"
  | "users_segment:update"
  | "users_segment:delete"
  | "accounts_segment:update"
  | "accounts_segment:delete"
  | "ship:update";
export type HullBatchHandlerChannel = HullNotificationHandlerChannel;

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
type HullManifestTag =
  | "batch"
  | "batch-accounts"
  | "kraken"
  | "single-install"
  | "first-install";

export type HullManifest = {
  name: string,
  description: string,
  tags: Array<HullManifestTag>,
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

  tabs?: Array<HullManifestHtmlConfig>,
  html?: Array<HullManifestHtmlConfig>,

  incoming?: Array<HullManifestIncomingConfig>,
  json?: Array<HullManifestJsonConfig>,
  status?: HullManifestStatus,
  statuses?: Array<HullManifestStatus>,
  schedules?: Array<HullManifestSchedule>
};

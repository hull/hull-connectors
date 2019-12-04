// @flow

import type {
  HullContext,
  HTTPMethod,
  HullResponse,
  HullNotificationHandlerChannel,
  HullBatchHandlerChannel,
  HullUserUpdateMessage,
  HullUserDeleteMessage,
  HullUserSegment,
  HullAccountUpdateMessage,
  HullAccountDeleteMessage,
  HullAccountSegment,
  HullConnectorUpdateMessage,
  HullIncomingHandlerMessage,
  HullOAuthHandlerParams,
  HullStatusResponse,
  HullExternalResponse,
  HullNotificationResponse,
  HullNotificationHandlerOptions,
  HullSchedulerHandlerOptions,
  HullHtmlHandlerOptions,
  HullJsonHandlerOptions,
  HullBatchHandlerOptions,
  HullIncomingHandlerOptions,
  HullStatusHandlerOptions
} from "./index";

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
  timedout?: boolean;
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

export type HullOauthAuthorizeMessage = {|
  ...HullIncomingHandlerMessage,
  account?: HullOAuthAccount
|};

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

export type HullIncomingHandlerCallback = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage,
  res: HullResponse
) => HullExternalResponse;
export type HullSchedulerHandlerCallback = HullIncomingHandlerCallback;
export type HullHtmlHandlerCallback = HullIncomingHandlerCallback;
export type HullJsonHandlerCallback = HullIncomingHandlerCallback;
export type HullOAuthHandlerCallback = () => void | HullOAuthHandlerParams;

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

export type HullHandlersConfiguration = {
  jobs?: { [string]: any },
  subscriptions?: { [string]: HullNotificationHandlerCallback },
  batches?: { [string]: HullBatchHandlerCallback },
  tabs?: {
    [string]: HullHtmlHandlerCallback | HullOAuthHandlerCallback
  },
  statuses?: { [string]: HullStatusHandlerCallback },
  schedules?: { [string]: HullSchedulerHandlerCallback },
  json?: { [string]: HullJsonHandlerCallback },
  incoming?: { [string]: HullIncomingHandlerCallback }
};

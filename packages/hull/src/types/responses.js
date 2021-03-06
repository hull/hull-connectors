// @flow
import type {
  HullAttributeMapping,
  HullUISelectOptions,
  HullEntityName
} from "./index";

// =====================================
//   Handler Responses
// =====================================

// Should disappear in the future to be replaced with a function return instead.
// declare class $HullResponse extends express$Response {}
export type HullResponse = express$Response;

// === Notification Handler response
export type HullNotificationFlowControl =
  | {
      type: "next" | "retry",
      size?: number,
      in?: number,
      in_time?: number
    }
  | {
      type: "next" | "retry",
      max_messages?: number,
      min_delay?: number,
      max_delay?: number
    };

export type HullKrakenResponse = void | {|
  action: "success" | "skip" | "error",
  type: HullEntityName | "event",
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

export type HullOAuthAuthorizeResponseData = void | {
  private_settings?: {}
};

export type HullOAuthAuthorizeResponse = void | Promise<HullOAuthAuthorizeResponseData>;

export type HullSettingsResponseData = void | {
  status: number,
  data: {
    message: string,
    html?: string
  }
};

export type HullSettingsResponse = void | Promise<HullSettingsResponseData>;

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

export type HullExternalResponseData = void | {
  status?: number,
  pageLocation?: string,
  error?: any,
  data?: any,
  text?: string
};

export type HullExternalResponse =
  | HullExternalResponseData
  | Promise<HullExternalResponseData>;

export type HullUISelectData = {
  label?: string,
  options: HullUISelectOptions,
  default: Array<HullAttributeMapping>
};

export type HullUISelectResponseData = {|
  ...HullExternalResponseData,
  status?: number,
  data: HullUISelectData
|};

export type HullUISelectResponse =
  | HullUISelectResponseData
  | Promise<HullUISelectResponseData>;

export type HullCredentialsResponse = {
  status: number,
  data: {
    url: string
  }
};

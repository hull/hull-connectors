// @flow
import type {
  HullClient,
  HullConnector,
  HullContext,
  HullUserUpdateMessage
} from "hull";

export type ConnectorPublicSettings = {
  script: string,
  ga: {
    map_user_id: string
  }
};
export type ConnectorPrivateSettings = {
  public_traits: Array<string>,
  public_events: Array<string>,
  public_segments: Array<string>,
  public_account_segments: Array<string>,
  synchronized_segments: Array<string>,
  whitelisted_domains: Array<string>
};

export type BrowserConnector = {
  ...$Exact<HullConnector>,
  private_settings: ConnectorPrivateSettings,
  settings: ConnectorPublicSettings
};

// export type HullContext = Context<HullConnector>;
// export type HullRequest = Request<HullContext>;

export type Segments = Array<string>;
export type Events = Array<string>;
export type Changes = {};
export type Settings = {};
export type AttributesCollection = {
  [string]: any
};

export type HullUserNotification = {
  events: Array<Event>,
  user: AttributesCollection,
  account: AttributesCollection,
  account_segments: Array<{ name: string }>,
  segments: Array<{ name: string }>
};

export type PrivatePayload = {
  message: "private",
  user: {
    id: string
  },
  segments: {}
};

export type Destinations = {
  google_analytics: {
    userId?: string
  }
};

export type PublicPayload = {
  message: "ok",
  user: AttributesCollection,
  account: AttributesCollection,
  events: Events,
  destinations: Destinations,
  user_segments: Segments,
  account_segments: Segments,
  public_account_segments: Segments,
  public_user_segments: Segments,
  settings: ConnectorPublicSettings
};

export type PublicUpdate = {
  ...$Exact<PublicPayload>,
  changes: Changes
};

export type Payload = PrivatePayload | PublicPayload;

type storeSet = (id: string, data: any) => void;
type storeGet = (id: string) => any;

export type SendPayloadArgs = {
  client: HullClient,
  namespace: string,
  rooms: Array<string>,
  payload: Payload
};

export type Store = {
  get: storeGet,
  set: storeSet,
  pool: (id: string, eventId?: string) => any,
  setup: (ctx: HullContext) => any,
  lru: (
    id: string
  ) => {
    get: storeGet,
    set: storeSet
  }
};

export type UserPayload = {
  user: $PropertyType<HullUserUpdateMessage, "user">,
  account: $PropertyType<HullUserUpdateMessage, "account">,
  segments: $PropertyType<HullUserUpdateMessage, "segments">,
  account_segments: $PropertyType<HullUserUpdateMessage, "account_segments">,
  events: $PropertyType<HullUserUpdateMessage, "events">,
  client: HullClient,
  connector: HullConnector
};

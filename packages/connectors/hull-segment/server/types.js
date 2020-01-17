// @flow

/* Local Custom Types */
export type SegmentIntegrations = {
  [string]: any
};
export type SegmentTraits = {
  [string]: any
};
export type SegmentProperties = {
  [string]: any
};
export type SegmentContext = {
  ip?: string | number,
  active?: boolean,
  // groupId?: string,
  location?: {
    city?: string,
    country?: string,
    region?: string,
    speed?: string,
    latitude?: string,
    longitude?: string
  },
  device?: {
    model?: string,
    type?: string
  },
  os?: {
    name?: string,
    version?: string
  },
  app?: {
    build?: string,
    name?: string,
    version?: string
  },
  page?: {
    hash?: string,
    path?: string,
    referrer?: string,
    search?: string,
    title?: string,
    url?: string
  },
  referrer?: {
    type?: string,
    name?: string,
    url?: string,
    link?: string
  },
  traits?: SegmentTraits,
  userAgent?: string
};

/* Incoming Segment calls */
export type SegmentIncomingBase = {
  anonymousId?: ?string,
  userId?: string,
  type: "screen" | "page" | "track" | "identify" | "group",
  version: number,
  timestamp: string,
  active?: boolean,
  event: typeof undefined,
  originalTimestamp?: string,
  sentAt?: string,
  receivedAt?: string,
  integrations: SegmentIntegrations,
  context: SegmentContext,
  traits?: SegmentProperties
};
export type SegmentIncomingPage = {
  ...$Exact<SegmentIncomingBase>,
  type: "page",
  name?: string,
  event?: string,
  properties?: {
    [string]: any
  }
};
export type SegmentIncomingScreen = {
  ...$Exact<SegmentIncomingBase>,
  type: "screen",
  name: string,
  event?: string,
  properties?: SegmentProperties
};
export type SegmentIncomingTrack = {
  ...$Exact<SegmentIncomingBase>,
  type: "track",
  active?: boolean,
  event?: string,
  properties?: SegmentProperties
};

export type SegmentIncomingIdentify = {
  ...$Exact<SegmentIncomingBase>,
  type: "identify",
  traits: SegmentProperties
};
export type SegmentIncomingGroup = {
  ...$Exact<SegmentIncomingBase>,
  type: "group",
  groupId?: string,
  traits: SegmentProperties
};

export type SegmentIncomingPayload =
  // | SegmentIncomingAlias
  | SegmentIncomingIdentify
  | SegmentIncomingPage
  | SegmentIncomingScreen
  | SegmentIncomingTrack
  | SegmentIncomingGroup;

/* Outgoing Segment calls */
export type SegmentOutgoingBase = {
  context: SegmentContext,
  userId?: ?string,
  integrations: SegmentIntegrations,
  anonymousId?: ?string,
  timestamp?: Date | string
};
export type SegmentOutgoingPage = {
  ...$Exact<SegmentOutgoingBase>,
  channel: "browser",
  name: string,
  properties: SegmentProperties
};
export type SegmentOutgoingScreen = {
  ...$Exact<SegmentOutgoingBase>,
  channel: "mobile",
  name: string
};
export type SegmentOutgoingIdentify = {
  ...$Exact<SegmentOutgoingBase>,
  traits?: SegmentTraits,
  context?: SegmentContext
};
export type SegmentOutgoingTrack = {
  ...$Exact<SegmentOutgoingBase>,
  event?: string,
  properties: SegmentProperties
};
export type SegmentOutgoingGroup = {};

export type SegmentOutgoingPayload =
  | SegmentOutgoingTrack
  | SegmentOutgoingPage
  | SegmentOutgoingScreen;

export type StatusError = Error & {
  status?: number
};

export type SegmentClient = {
  track: SegmentOutgoingTrack => void,
  page: SegmentOutgoingPage => void,
  enqueue: ("page" | "screen" | "track", SegmentOutgoingPayload) => void,
  group: SegmentOutgoingGroup => void,
  identify: SegmentOutgoingIdentify => void
};

export type SegmentConnectorSettings = {
  settings: {
    write_key: string,
    ignore_segment_userId: boolean,
    public_id_field: "id" | "external_id" | "email",
    public_account_id_field: "id" | "external_id" | "domain",
    handle_pages: boolean,
    handle_screens: boolean,
    handle_accounts: boolean
  },
  private_settings: {
    synchronized_segments: Array<string>,
    synchronized_properties: Array<string>,
    synchronized_account_segments: Array<string>,
    synchronized_account_properties: Array<string>,
    forward_events: boolean,
    send_events: Array<string>
  }
};

// @flow

import type { HullUserUpdateMessage } from "hull";
const expect = require("expect");

expect.extend({
  whatever() {
    return {
      pass: true,
      message: ""
    };
  }
});

const CONNECTOR_ID = "9993743b22d60dd829001999";
export const CONNECTOR = {
  id: CONNECTOR_ID,
  private_settings: {}
};

export const STANDARD_SEGMENT = {
  id: "hullSegmentId",
  name: "standard_segment",
  created_at: "",
  updated_at: ""
};
export const STANDARD_SEGMENTS = [STANDARD_SEGMENT];
export const STANDARD_USER_SEGMENTS = [
  { ...STANDARD_SEGMENT, type: "users_segment" }
];
export const STANDARD_ACCOUNT_SEGMENTS = [
  { ...STANDARD_SEGMENT, type: "accounts_segment" }
];

export const STANDARD_SEGMENT_IDS = ["hullSegmentId"];

export const NEXT_FLOW_CONTROL = {
  type: "next",
  in: 10,
  size: 100
};

export const USER = {
  id: "1234",
  anonymous_ids: ["1234"],
  external_id: undefined,
  segment_ids: []
};
export const ACCOUNT = { id: "a1234", domain: "bar.com", segment_ids: [] };
export const EVENTS = [];
export const CHANGES = {};

export const METRIC_CONNECTOR_REQUEST = ["increment", "connector.request", 1];
export const METRIC_INCOMING_USER = ["increment", "ship.incoming.users", 1];
export const METRIC_INCOMING_EVENT = ["increment", "ship.incoming.events", 1];
export const METRIC_SERVICE_REQUEST = [
  "increment",
  "connector.service_api.call",
  1
];

export const messageWithUser = ({
  message_id = "messageID_0000",
  user = USER,
  changes = CHANGES,
  segments = STANDARD_USER_SEGMENTS,
  segment_ids = STANDARD_SEGMENT_IDS,
  account_segments = STANDARD_ACCOUNT_SEGMENTS,
  account_segment_ids = STANDARD_SEGMENT_IDS,
  events = EVENTS,
  account = ACCOUNT
}: { ...HullUserUpdateMessage } = {}) => ({
  handlerUrl: "smart-notifier",
  channel: "user:update",
  externalApiMock: () => {},
  usersSegments: [],
  accountsSegments: [],
  messages: [
    {
      message_id,
      user,
      changes,
      account,
      events,
      segments,
      segment_ids,
      account_segments,
      account_segment_ids
    }
  ],
  response: {
    flow_control: NEXT_FLOW_CONTROL
  }
});

const claimsFactory = ({ subjectType = "user", claims }) => ({
  [`as${subjectType === "user" ? "User" : "Account"}`]: claims,
  subjectType
});

export const traits = ({
  subjectType,
  claims,
  attributes
}: {
  subjectType: "user" | "account",
  claims: {},
  attributes: {}
}) => ["traits", claimsFactory({ subjectType, claims }), attributes];

const STANDARD_EVENT_PROPS = {
  _bid: expect.whatever(),
  _sid: expect.whatever(),
  event_id: expect.whatever(),
  source: "segment"
};

export const track = ({
  subjectType,
  claims,
  event,
  created_at,
  properties
}: {
  subjectType: "user",
  claims: {},
  event: "string",
  created_at: string,
  properties: {}
}) => [
  "track",
  claimsFactory({ subjectType, claims }),
  {
    ...STANDARD_EVENT_PROPS,
    created_at,
    event,
    properties
  }
];
export const link = ({
  claims,
  accountClaims
}: {
  claims: {},
  accountClaims: {}
}) => [
  "traits",
  {
    ...claimsFactory({ subjectType: "user", claims }),
    ...claimsFactory({ subjectType: "account", claims: accountClaims })
  },
  {}
];

export const platformApiCalls = [
  ["GET", "/api/v1/app", {}, {}],
  [
    "GET",
    `/api/v1/users_segments?shipId=${CONNECTOR_ID}`,
    { shipId: CONNECTOR_ID },
    {}
  ],
  [
    "GET",
    `/api/v1/accounts_segments?shipId=${CONNECTOR_ID}`,
    { shipId: CONNECTOR_ID },
    {}
  ]
];

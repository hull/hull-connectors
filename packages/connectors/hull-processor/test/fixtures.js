// @flow

import type { HullUserUpdateMessage } from "hull";

export const CONNECTOR = {
  id: "123456789012345678901234",
  private_settings: {}
};

export const STANDARD_SEGMENT = {
  id: "hullSegmentId",
  name: "hullSegmentName",
  created_at: "",
  updated_at: ""
};

const STANDARD_USER_SEGMENT = {
  ...STANDARD_SEGMENT,
  type: "users_segment"
};
const STANDARD_ACCOUNT_SEGMENT = {
  ...STANDARD_SEGMENT,
  type: "accounts_segment"
};

export const STANDARD_SEGMENT_IDS = ["hullSegmentId"];

export const NEXT_FLOW_CONTROL = {
  type: "next",
  in: 10,
  size: 100
};

export const USER = {
  id: "1234",
  anonymous_ids: [],
  external_id: undefined,
  segment_ids: []
};
export const ACCOUNT = {
  id: "1234",
  domain: "bar.com",
  segment_ids: []
};
export const EVENTS = [];
export const CHANGES = {};

export const METRIC_CONNECTOR_REQUEST = ["increment", "connector.request", 1];
export const METRIC_INCOMING_USER = ["increment", "ship.incoming.users", 1];
export const METRIC_INCOMING_ACCOUNT = ["increment", "ship.incoming.accounts", 1];
export const METRIC_INCOMING_EVENT = ["increment", "ship.incoming.events", 1];
export const METRIC_INCOMING_LINK = ["increment", "ship.incoming.accounts.link", 1];
export const METRIC_SERVICE_REQUEST = [
  "increment",
  "connector.service_api.call",
  1
];

export const messageWithUser = ({
  user = USER,
  changes = CHANGES,
  segments = [STANDARD_USER_SEGMENT],
  segment_ids = STANDARD_SEGMENT_IDS,
  account_segments = [STANDARD_ACCOUNT_SEGMENT],
  account_segment_ids = STANDARD_SEGMENT_IDS,
  events = EVENTS,
  account = ACCOUNT
}: $Shape<HullUserUpdateMessage> = {}) => ({
  handlerUrl: "smart-notifier",
  channel: "user:update",
  externalApiMock: () => {},
  usersSegments: [],
  accountsSegments: [],
  messages: [
    {
      user,
      changes,
      account,
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

export const connectorWithCode = (code: string) => ({
  ...CONNECTOR,
  private_settings: { ...CONNECTOR.private_settings, code }
});

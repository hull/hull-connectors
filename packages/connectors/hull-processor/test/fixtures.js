// @flow

export const CONNECTOR = {
  id: "123456789012345678901234",
  private_settings: {}
};

export const STANDARD_SEGMENTS = [
  { id: "hullSegmentId", name: "hullSegmentName" }
];

export const NEXT_FLOW_CONTROL = {
  type: "next",
  in: 10,
  size: 100
};

export const USER = {
  id: 1234,
  email: "foo@bar.com",
  domain: "bar.com"
};
export const ACCOUNT = {
  id: 1234,
  domain: "bar.com"
};

export const METRIC_CONNECTOR_REQUEST = ["increment", "connector.request", 1];
export const METRIC_INCOMING_USER = ["increment", "ship.incoming.users", 1];

export const messageWithUser = ({
  user = USER,
  account = ACCOUNT,
  segments = STANDARD_SEGMENTS,
  flow_control = NEXT_FLOW_CONTROL
} = {}) => ({
  handlerUrl: "smart-notifier",
  channel: "user:update",
  externalApiMock: () => {},
  usersSegments: [],
  accountsSegments: [],
  messages: [
    {
      user,
      account,
      segments
    }
  ],
  response: {
    flow_control
  }
});

export const connectorWithCode = (code: string) => ({
  ...CONNECTOR,
  private_settings: { ...CONNECTOR.private_settings, code }
});

const expect = require("expect");
import { encrypt } from "hull/src/utils/crypto";
import _ from "lodash";
import {
  groupPayload,
  groupOutput,
  identifyPayload,
  identifyOutput,
  pagePayload,
  pageOutput,
  screenPayload,
  screenOutput,
  trackPayload,
  trackOutput
} from "./fixtures";
import {
  platformApiCalls,
  CONNECTOR,
  STANDARD_USER_SEGMENTS,
  STANDARD_ACCOUNT_SEGMENTS,
  STANDARD_EVENT_PROPS,
  // METRIC_INCOMING_USER,
  // METRIC_SERVICE_REQUEST,
  // METRIC_CONNECTOR_REQUEST,
  USER,
  ACCOUNT,
  EVENTS,
  messageWithUser,
  traits,
  track,
  link
} from "hull/test/support/fixtures";

const private_settings = {
  synchronized_segments: [],
  outgoing_user_attribute_mapping: [
    {
      hull: "email",
      service: "email",
      overwrite: true,
      readOnly: true
    },
    {
      hull: "segments.name",
      service: "hull_segments",
      overwrite: true,
      readOnly: true
    },
    {
      hull: "account_segments.name",
      service: "hull_account_segments",
      overwrite: true,
      readOnly: true
    }
  ],
  outgoing_account_attribute_mapping: [
    {
      service: "domain",
      hull: "account.domain",
      overwrite: true,
      readOnly: true
    },
    {
      service: "hull_segments",
      hull: "account_segments.name",
      overwrite: true,
      readOnly: true
    }
  ],
  synchronized_properties: [],
  link_users_in_hull: true,
  synchronized_events: [],
  forward_events: false,
  synchronized_account_segments: [],
  synchronized_account_properties: []
};
const settings = {
  write_key: "foobar",
  ignore_segment_userId: false,
  public_id_field: "external_id",
  public_account_id_field: "external_id",
  handle_pages: true,
  handle_screens: true,
  handle_accounts: true
};

expect.extend({
  whatever() {
    return {
      pass: true,
      message: ""
    };
  }
});

const increment_request = type => ["increment", `request.${type}`, 1];
const METRIC_INCREMENT_REQUEST = ["increment", "connector.request", 1];
const METRIC_INCREMENT_SERVICE = ["increment", "ship.service_api.call", 1];
const METRIC_INCREMENT_TRACK = increment_request("track");
const METRIC_INCREMENT_PAGE = increment_request("page");
const METRIC_INCREMENT_IDENTIFY = increment_request("identify");
const METRIC_INCREMENT_GROUP = increment_request("group");
const METRIC_INCREMENT_SCREEN = increment_request("screen");
const NEXT_FLOW_CONTROL = {
  flow_control: {
    type: "next",
    in: 10,
    in_time: 0,
    size: 100
  }
};
const RETRY_FLOW_CONTROL = {
  flow_control: {
    type: "retry",
    in: 10,
    in_time: 0,
    size: 100
  }
};

const encryptedToken = ({ config, plainCredentials }) =>
  Buffer.from(encrypt(plainCredentials, config.hostSecret)).toString("base64");
const headers = ({ config, plainCredentials }) => ({
  Authorization: `Basic ${encryptedToken({ config, plainCredentials })}`
});
const addWhatever = key => pld => ({ ...pld, [key]: expect.whatever() });
const whateverEventId = addWhatever("event_id");

const FIREHOSE_TRACK = [
  "track",
  { subjectType: "user", asUser: trackOutput.asUser },
  whateverEventId(trackOutput.data)
];
const FIREHOSE_SCREEN = [
  "track",
  { subjectType: "user", asUser: screenOutput.asUser },
  whateverEventId(screenOutput.data)
];
const FIREHOSE_PAGE = [
  "track",
  { subjectType: "user", asUser: pageOutput.asUser },
  whateverEventId(pageOutput.data)
];
const FIREHOSE_IDENTIFY = [
  "traits",
  { subjectType: "user", asUser: identifyOutput.asUser },
  identifyOutput.data
];
const FIREHOSE_ACCOUNT_IDENTIFY = [
  "traits",
  { subjectType: "account", asAccount: groupOutput.asAccount },
  groupOutput.data
];
const FIREHOSE_ACCOUNT_LINK_IDENTIFY = [
  "traits",
  {
    subjectType: "account",
    asUser: groupOutput.asUser,
    asAccount: groupOutput.asAccount
  },
  groupOutput.data
];

const segment_payload = payloads =>
  payloads.map(payload => ({
    batch: payload.map(p => ({
      _metadata: { nodeVersion: "10.16.0" },
      timestamp: /.*/,
      messageId: /.*/,
      ...p,
      context: {
        active: false,
        ip: 0,
        library: { name: "analytics-node", version: "3.3.0" },
        ...p.context
      }
    })),
    timestamp: /.*/,
    sentAt: /.*/
  }));

const TESTS = [
  // "Reject if no Anonymous ID nor UserId nor Email",
  {
    title: "Skip if no Anonymous ID nor UserId nor Email",
    connector: {
      private_settings,
      settings: { ...settings, ignore_segment_userId: true }
    },
    message: messageWithUser({
      user: { ...USER, anonymous_ids: [] }
    }),
    platformApiCalls: [],
    usersSegments: STANDARD_USER_SEGMENTS,
    accountsSegments: STANDARD_ACCOUNT_SEGMENTS,
    logs: [
      [
        "info",
        "outgoing.user.skip",
        expect.whatever(),
        {
          anonymousId: undefined,
          anonymousIds: [],
          message: "No Identifier available",
          public_id_field: "external_id",
          userId: undefined
        }
      ]
    ],
    metrics: [METRIC_INCREMENT_REQUEST],
    response: {
      ...NEXT_FLOW_CONTROL
    },
    responseStatusCode: 200,
    firehoseEvents: []
  },
  // "Send to Segment a simple User, map Segments, but skip empty account",
  {
    title:
      "Send to Segment a simple User, map Segments, but skip empty account",
    connector: {
      private_settings,
      settings: { ...settings, ignore_segment_userId: true }
    },
    message: messageWithUser({
      user: {
        ...USER,
        email: "foo@bar.com"
      }
    }),
    body: segment_payload([
      [
        {
          anonymousId: "1234",
          traits: {
            email: "foo@bar.com",
            hull_segments: "standard_segment",
            hull_account_segments: "standard_segment"
          },
          context: {},
          integrations: { Hull: false },
          type: "identify"
        }
      ]
    ]),
    platformApiCalls: [],
    usersSegments: STANDARD_USER_SEGMENTS,
    accountsSegments: STANDARD_ACCOUNT_SEGMENTS,
    logs: [
      [
        "info",
        "outgoing.account.skip",
        expect.whatever(),
        {
          anonymousId: "1234",
          groupId: undefined,
          anonymousIds: undefined,
          public_account_id_field: "external_id",
          message: "No Identifier available"
        }
      ]
    ],
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_SERVICE],
    response: {
      ...NEXT_FLOW_CONTROL
    },
    responseStatusCode: 200,
    firehoseEvents: []
  },
  // "Send to Segment a simple User, map Segments, and send account",
  {
    title: "Send to Segment a simple User, map Segments, and send account",
    connector: {
      private_settings,
      settings
    },
    message: messageWithUser({
      user: {
        ...USER,
        external_id: "exexe",
        email: "foo@bar.com"
      },
      account: {
        ...ACCOUNT,
        external_id: "abcd",
        anonymous_ids: ["anon:1234"]
      }
    }),
    body: segment_payload([
      [
        {
          userId: "exexe",
          anonymousId: "1234",
          traits: {
            email: "foo@bar.com",
            hull_segments: "standard_segment",
            hull_account_segments: "standard_segment"
          },
          context: {},
          integrations: { Hull: false },
          type: "identify"
        }
      ],
      [
        {
          groupId: "abcd",
          userId: "exexe",
          anonymousId: "1234",
          traits: {
            domain: ACCOUNT.domain,
            hull_segments: "standard_segment"
          },
          context: {},
          integrations: { Hull: false },
          type: "group"
        }
      ]
    ]),
    platformApiCalls: [],
    usersSegments: STANDARD_USER_SEGMENTS,
    accountsSegments: STANDARD_ACCOUNT_SEGMENTS,
    logs: [],
    metrics: [
      METRIC_INCREMENT_REQUEST,
      METRIC_INCREMENT_SERVICE,
      METRIC_INCREMENT_SERVICE
    ],
    response: {
      ...NEXT_FLOW_CONTROL
    },
    responseStatusCode: 200,
    firehoseEvents: []
  },
  // "Only send whitelisted events",
  {
    title: "Only send whitelisted events",
    connector: {
      private_settings: { ...private_settings, synchronized_events: ["Foo"] },
      settings
    },
    message: messageWithUser({
      events: [
        {
          ...STANDARD_EVENT_PROPS,
          event: "Foo",
          properties: {},
          context: {}
        },
        {
          ...STANDARD_EVENT_PROPS,
          event: "Bar",
          properties: {},
          context: {}
        }
      ]
    }),
    body: segment_payload([
      [
        {
          anonymousId: "1234",
          traits: {
            hull_segments: "standard_segment",
            hull_account_segments: "standard_segment"
          },
          context: {},
          integrations: { Hull: false },
          type: "identify"
        }
      ],
      [
        {
          anonymousId: "1234",
          timestamp: null,
          event: "Foo",
          properties:{},
          context: {
            active: true,
            traits: {
              hull_segments: "standard_segment",
              hull_account_segments: "standard_segment"
            },
            os: {},
            page: {},
            location: {}
          },
          integrations: { Hull: false },
          type: "track"
        }
      ]
    ]),
    platformApiCalls: [],
    usersSegments: STANDARD_USER_SEGMENTS,
    accountsSegments: STANDARD_ACCOUNT_SEGMENTS,
    logs: [
      [
        "info",
        "outgoing.account.skip",
        expect.whatever(),
        {
          anonymousId: "1234",
          groupId: undefined,
          anonymousIds: undefined,
          public_account_id_field: "external_id",
          message: "No Identifier available"
        }
      ]
    ],
    metrics: [
      METRIC_INCREMENT_REQUEST,
      METRIC_INCREMENT_SERVICE,
      METRIC_INCREMENT_SERVICE
    ],
    response: {
      ...NEXT_FLOW_CONTROL
    },
    responseStatusCode: 200,
    firehoseEvents: []
  },
  // "Find an anonymousId from the Events to perform Identify",
  {
    title: "Find an anonymousId from the Events to perform Identify",
    connector: {
      private_settings,
      settings
    },
    message: messageWithUser({
      user: {
        id: "0000",
        anonymous_ids: []
      },
      events: [
        {
          event: "Foo",
          anonymous_id: "1234"
        }
      ]
    }),
    body: segment_payload([
      [
        {
          anonymousId: "1234",
          traits: {
            hull_segments: "standard_segment",
            hull_account_segments: "standard_segment"
          },
          context: {},
          integrations: { Hull: false },
          type: "identify"
        }
      ]
    ]),
    platformApiCalls: [],
    usersSegments: STANDARD_USER_SEGMENTS,
    accountsSegments: STANDARD_ACCOUNT_SEGMENTS,
    logs: [
      [
        "info",
        "outgoing.account.skip",
        expect.whatever(),
        {
          anonymousId: "1234",
          groupId: undefined,
          anonymousIds: undefined,
          public_account_id_field: "external_id",
          message: "No Identifier available"
        }
      ]
    ],
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_SERVICE],
    response: {
      ...NEXT_FLOW_CONTROL
    },
    responseStatusCode: 200,
    firehoseEvents: []
  },
  // "Send events with the right anonymousId",
  {
    title: "Send events with the right anonymousId",
    connector: {
      private_settings: { ...private_settings, synchronized_events: ["Foo"] },
      settings
    },
    message: messageWithUser({
      user: {
        id: "0000",
        anonymous_ids: ["abcd", "1234"]
      },
      events: [
        {
          event: "Foo",
          anonymous_id: "1234"
        }
      ]
    }),
    body: segment_payload([
      [
        {
          anonymousId: "1234",
          traits: {
            hull_segments: "standard_segment",
            hull_account_segments: "standard_segment"
          },
          context: {},
          integrations: { Hull: false },
          type: "identify"
        }
      ],
      [
        {
          anonymousId: "1234",
          timestamp: null,
          event: "Foo",
          context: {
            active: true,
            traits: {
              hull_segments: "standard_segment",
              hull_account_segments: "standard_segment"
            },
            os: {},
            page: {},
            location: {}
          },
          integrations: { Hull: false },
          type: "track"
        }
      ]
    ]),
    platformApiCalls: [],
    usersSegments: STANDARD_USER_SEGMENTS,
    accountsSegments: STANDARD_ACCOUNT_SEGMENTS,
    logs: [
      [
        "info",
        "outgoing.account.skip",
        expect.whatever(),
        {
          anonymousId: "1234",
          groupId: undefined,
          anonymousIds: undefined,
          public_account_id_field: "external_id",
          message: "No Identifier available"
        }
      ]
    ],
    metrics: [
      METRIC_INCREMENT_REQUEST,
      METRIC_INCREMENT_SERVICE,
      METRIC_INCREMENT_SERVICE
    ],
    response: {
      ...NEXT_FLOW_CONTROL
    },
    responseStatusCode: 200,
    firehoseEvents: []
  }
];

export default TESTS;

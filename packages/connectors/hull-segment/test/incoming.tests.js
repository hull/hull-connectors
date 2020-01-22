const expect = require("expect");
import { encrypt } from "hull/src/utils/crypto";
import _ from "lodash";
import {
  groupPayload,
  identifyPayload,
  identifyOutput,
  pagePayload,
  pageOutput,
  screenPayload,
  screenOutput,
  trackPayload,
  trackOutput
} from "./fixtures";

expect.extend({
  whatever() {
    return {
      pass: true,
      message: ""
    };
  }
});

const INCREMENT_REQUEST = ["increment", "connector.request", 1];
const INCREMENT_TRACK = ["increment", "request.track", 1];
const INCREMENT_PAGE = ["increment", "request.page", 1];
const INCREMENT_IDENTIFY = ["increment", "request.identify", 1];
const INCREMENT_SCREEN = ["increment", "request.screen", 1];
const STANDARD_EVENT_PROPS = {
  _bid: expect.whatever(),
  _sid: expect.whatever(),
  event_id: expect.whatever(),
  source: "segment"
};

const claimsFactory = ({ subjectType = "user", claims }) => ({
  [`as${subjectType === "user" ? "User" : "Account"}`]: claims,
  subjectType
});

const identify = ({ subjectType, claims, attributes }) => [
  "traits",
  claimsFactory({ subjectType, claims }),
  attributes
];
const track = ({ subjectType, claims, event, created_at, properties }) => [
  "track",
  claimsFactory({ subjectType, claims }),
  {
    ...STANDARD_EVENT_PROPS,
    created_at,
    event,
    properties
  }
];
const link = ({ claims, accountClaims }) => [
  "traits",
  {
    ...claimsFactory({ subjectType: "user", claims }),
    ...claimsFactory({ subjectType: "account", claims: accountClaims })
  },
  {}
];
const platformApiCalls = [
  ["GET", "/api/v1/app", {}, {}],
  [
    "GET",
    "/api/v1/users_segments?shipId=9993743b22d60dd829001999",
    { shipId: "9993743b22d60dd829001999" },
    {}
  ],
  [
    "GET",
    "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",
    { shipId: "9993743b22d60dd829001999" },
    {}
  ]
];

const encryptedToken = ({ config, plainCredentials }) =>
  Buffer.from(encrypt(plainCredentials, config.hostSecret)).toString("base64");
const headers = ({ config, plainCredentials }) => ({
  Authorization: `Basic ${encryptedToken({ config, plainCredentials })}`
});

const private_settings = {
  synchronized_segments: [],
  outgoing_user_attribute_mapping: [],
  outgoing_account_attribute_mapping: [],
  synchronized_properties: [],
  link_users_in_hull: true,
  synchronized_events: [],
  forward_events: false,
  synchronized_account_segments: [],
  synchronized_account_properties: []
};
const settings = {
  write_key: undefined,
  ignore_segment_userId: false,
  public_id_field: "external_id",
  public_account_id_field: "external_id",
  handle_pages: true,
  handle_screens: true,
  handle_accounts: true
};

const addWhatever = key => payload => ({
  ...payload,
  [key]: expect.whatever()
});
const whateverEventId = addWhatever("event_id");

const FIREHOSE_TRACK = [
  "track",
  claimsFactory({
    subjectType: "user",
    claims: trackOutput.claims
  }),
  whateverEventId(trackOutput.data)
];

const FIREHOSE_SCREEN = [
  "track",
  claimsFactory({
    subjectType: "user",
    claims: screenOutput.claims
  }),
  whateverEventId(screenOutput.data)
];

const FIREHOSE_PAGE = [
  "track",
  claimsFactory({
    subjectType: "user",
    claims: pageOutput.claims
  }),
  whateverEventId(pageOutput.data)
];
const FIREHOSE_IDENTIFY = [
  "traits",
  claimsFactory({
    subjectType: "user",
    claims: identifyOutput.claims
  }),
  identifyOutput.data
];

const TESTS = [
  {
    title: "Should return 401 on No Token",
    body: trackPayload,
    connector: {
      private_settings,
      settings
    },
    headers: ({ config, plainCredentials }) => ({}),
    platformApiCalls: [],
    logs: [],
    metrics: [],
    response: { message: "No Authorization Headers" },
    responseStatusCode: 400,
    firehoseEvents: []
  },
  {
    title: "Should return 401 on Invalid Token",
    body: trackPayload,
    connector: {
      private_settings,
      settings
    },
    headers: ({ config, plainCredentials }) => ({
      Authorization: `Basic SU5WQUxJRA==`
    }),
    platformApiCalls: [],
    logs: [],
    metrics: [],
    response: { error: "Invalid Token", message: "Invalid Token" },
    responseStatusCode: 401,
    firehoseEvents: []
  },
  {
    title: "Should return 401 if Connector is not found",
    body: trackPayload,
    connector: {
      private_settings,
      settings
    },
    headers: ({ config, plainCredentials }) =>
      headers({
        config,
        plainCredentials: {
          ...plainCredentials,
          ship: "not_found"
        }
      }),
    platformApiCalls: [],
    logs: [],
    metrics: [],
    response: {
      error: "id property in Configuration is invalid: not_found",
      message: "id property in Configuration is invalid: not_found"
    },
    responseStatusCode: 401,
    firehoseEvents: []
  },
  {
    title: "Should return 401 on missing claims in valid token",
    body: trackPayload,
    connector: {
      private_settings,
      settings
    },
    headers: ({ config, plainCredentials }) =>
      headers({ config, plainCredentials: {} }),
    platformApiCalls: [],
    logs: [],
    metrics: [],
    response: {
      error: "Configuration is missing required property: id",
      message: "Configuration is missing required property: id"
    },
    responseStatusCode: 401,
    firehoseEvents: []
  },
  {
    title: "Should return 501 on No Type",
    body: {},
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [
      [
        "debug",
        "incoming.request.error",
        {},
        { message: "Can't find Type in Payload", payload: {} }
      ]
    ],
    metrics: [INCREMENT_REQUEST, ["increment", "request.error", 1]],
    response: { message: "Not Supported" },
    responseStatusCode: 501,
    firehoseEvents: []
  },
  {
    title: "Should return 501 on invalid Type",
    body: { type: "bogus" },
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [
      ["debug", "incoming.bogus.error", {}, { payload: { type: "bogus" } }]
    ],
    metrics: [INCREMENT_REQUEST, ["increment", "request.error", 1]],
    response: { message: "Not Supported" },
    responseStatusCode: 501,
    firehoseEvents: []
  },
  {
    title: "Should trim the token when passed with extra spaces",
    body: trackPayload,
    connector: {
      private_settings,
      settings
    },
    headers: ({ config, plainCredentials }) => ({
      Authorization: `Basic ${encryptedToken({ config, plainCredentials })} `
    }),
    platformApiCalls,
    logs: [["debug", "incoming.track.start", {}, { payload: trackPayload }]],
    metrics: [INCREMENT_REQUEST, INCREMENT_TRACK],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_TRACK]
  },
  {
    title: "Should return invalid token when token has invalid signature",
    body: trackPayload,
    connector: {
      private_settings,
      settings
    },
    headers: ({ config, plainCredentials }) => ({
      Authorization: `Basic INVALID${encryptedToken({
        config,
        plainCredentials
      })}`
    }),
    platformApiCalls: [],
    logs: [],
    metrics: [],
    response: { error: "Invalid Token", message: "Invalid Token" },
    responseStatusCode: 401,
    firehoseEvents: []
  },
  {
    title: "Should capture a simple Tracking Call",
    body: trackPayload,
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [["debug", "incoming.track.start", {}, { payload: trackPayload }]],
    metrics: [INCREMENT_REQUEST, INCREMENT_TRACK],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_TRACK]
  },
  {
    title: "should Hull.track on page event by default",
    body: pagePayload,
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [["debug", "incoming.page.start", {}, { payload: pagePayload }]],
    metrics: [INCREMENT_REQUEST, INCREMENT_PAGE],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_PAGE]
  },
  {
    title: "should Hull.track on screen event by default",
    body: screenPayload,
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [["debug", "incoming.screen.start", {}, { payload: screenPayload }]],
    metrics: [INCREMENT_REQUEST, INCREMENT_SCREEN],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_SCREEN]
  },
  {
    title: "should Hull.traits on identify event by - with edge cases",
    body: identifyPayload,
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [
      ["debug", "incoming.identify.start", {}, { payload: identifyPayload }]
    ],
    metrics: [INCREMENT_REQUEST, INCREMENT_IDENTIFY],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_IDENTIFY]
  },
  {
    title: "Ignores incoming userId if settings.ignore_segment_userId is true",
    body: identifyPayload,
    connector: {
      private_settings,
      settings: { ...settings, ignore_segment_userId: true }
    },
    headers,
    platformApiCalls,
    logs: [
      ["debug", "incoming.identify.start", {}, { payload: identifyPayload }]
    ],
    metrics: [INCREMENT_REQUEST, INCREMENT_IDENTIFY],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [
      [
        "traits",
        claimsFactory({
          subjectType: "user",
          claims: _.omit(identifyOutput.claims, "external_id")
        }),
        identifyOutput.data
      ]
    ]
  },
  {
    title:
      "Skip if settings.ignore_segment_userId is true and we have no email",
    body: {
      ..._.omit(identifyPayload, "anonymousId"),
      traits: _.omit(identifyPayload.traits, "email")
    },
    connector: {
      private_settings,
      settings: { ...settings, ignore_segment_userId: true }
    },
    headers,
    platformApiCalls,
    logs: [
      [
        "debug",
        "incoming.identify.start",
        {},
        {
          payload: {
            ..._.omit(identifyPayload, "anonymousId"),
            traits: _.omit(identifyPayload.traits, "email")
          }
        }
      ],
      [
        "error",
        "incoming.user.error",
        {},
        {
          message:
            "No email address or anonymous ID present when ignoring segment's user ID."
        }
      ]
    ],
    metrics: [INCREMENT_REQUEST, INCREMENT_IDENTIFY],
    response: {
      message: "thanks"
    },
    responseStatusCode: 200,
    firehoseEvents: []
  }
];

export default TESTS;

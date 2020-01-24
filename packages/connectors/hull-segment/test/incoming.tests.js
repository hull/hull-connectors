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
import { platformApiCalls } from "hull/test/support/fixtures";

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
const METRIC_INCREMENT_TRACK = increment_request("track");
const METRIC_INCREMENT_PAGE = increment_request("page");
const METRIC_INCREMENT_IDENTIFY = increment_request("identify");
const METRIC_INCREMENT_GROUP = increment_request("group");
const METRIC_INCREMENT_SCREEN = increment_request("screen");

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

const TESTS = [
  // "Should return 401 on No Token",
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
  // "Should return 401 on Invalid Token",
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
  // "Should return 401 if Connector is not found",
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
  // "Should return 401 on missing claims in valid token",
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
  // "Should return 501 on No Type",
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
    metrics: [METRIC_INCREMENT_REQUEST, ["increment", "request.error", 1]],
    response: { message: "Not Supported" },
    responseStatusCode: 501,
    firehoseEvents: []
  },
  // "Should return 501 on invalid Type",
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
    metrics: [METRIC_INCREMENT_REQUEST, ["increment", "request.error", 1]],
    response: { message: "Not Supported" },
    responseStatusCode: 501,
    firehoseEvents: []
  },
  // "Should trim the token when passed with extra spaces",
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
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_TRACK],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_TRACK]
  },
  // "Should return invalid token when token has invalid signature",
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
  // "Should capture a simple Tracking Call",
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
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_TRACK],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_TRACK]
  },
  // "should call Hull.asUser.track on page event by default",
  {
    title: "should call Hull.asUser.track on page event by default",
    body: pagePayload,
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [["debug", "incoming.page.start", {}, { payload: pagePayload }]],
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_PAGE],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_PAGE]
  },
  // "should Hull.asAccount.traits and link if link_users_in_hull=true",
  {
    title: "should Hull.asAccount.traits and link if link_users_in_hull=true",
    body: groupPayload,
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [["debug", "incoming.group.start", {}, { payload: groupPayload }]],
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_GROUP],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_ACCOUNT_LINK_IDENTIFY]
  },
  // "should Hull.asAccount.traits on Group Call",
  {
    title:
      "should Hull.asAccount.traits and NOT link if link_users_in_hull=false",
    body: groupPayload,
    connector: {
      private_settings: { ...private_settings, link_users_in_hull: false },
      settings
    },
    headers,
    platformApiCalls,
    logs: [["debug", "incoming.group.start", {}, { payload: groupPayload }]],
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_GROUP],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_ACCOUNT_IDENTIFY]
  },
  // "should call Hull.asUser.track on screen event by default",
  {
    title: "should call Hull.asUser.track on screen event by default",
    body: screenPayload,
    connector: {
      private_settings,
      settings
    },
    headers,
    platformApiCalls,
    logs: [["debug", "incoming.screen.start", {}, { payload: screenPayload }]],
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_SCREEN],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_SCREEN]
  },
  // "should Hull.asUser.traits on identify event - with edge cases",
  {
    title: "should Hull.asUser.traits on identify event - with edge cases",
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
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_IDENTIFY],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [FIREHOSE_IDENTIFY]
  },
  // "Ignores incoming userId if settings.ignore_segment_userId is true",
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
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_IDENTIFY],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [
      [
        "traits",
        {
          asUser: _.omit(identifyOutput.asUser, "external_id"),
          subjectType: "user"
        },
        identifyOutput.data
      ]
    ]
  },
  // "Skip if settings.ignore_segment_userId is true and we have no email",
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
    metrics: [METRIC_INCREMENT_REQUEST, METRIC_INCREMENT_IDENTIFY],
    response: {
      message: "thanks"
    },
    responseStatusCode: 200,
    firehoseEvents: []
  }
];

export default TESTS;

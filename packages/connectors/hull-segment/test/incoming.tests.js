const expect = require("expect");
import { encrypt } from "hull/src/utils/crypto";
import {
  groupPayload,
  identifyPayload,
  pagePayload,
  screenPayload,
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
const logTrack = expect => [
  "info",
  "incoming.track.success",
  expect.whatever(),
  {
    ...trackOutput,
    context: {
      _bid: "d765ba53-51aa-5527-8cd1-30c96a636a78",
      _sid: "d765ba53-51aa-5527-8cd1-30c96a636a78-2016-04-12",
      created_at: "2016-04-12T14:03:57.770Z",
      ip: "0",
      latitude: 40.2964197,
      longitude: -76.9411617,
      referrer: "mekecwiw",
      source: "segment",
      url: "http://sikec.com/ateseoki",
      event_id: expect.whatever()
    }
  }
];
const firehoseTrack = expect => [
  "track",
  claimsFactory({
    subjectType: "user",
    claims: {
      anonymous_id: trackPayload.anonymous_id,
      external_id: trackPayload.user_id
    }
  }),
  {
    _bid: "d765ba53-51aa-5527-8cd1-30c96a636a78",
    _sid: "d765ba53-51aa-5527-8cd1-30c96a636a78-2016-04-12",
    created_at: "2016-04-12T14:03:57.770Z",
    event_id: expect.whatever(),
    ip: "0",
    latitude: 40.2964197,
    longitude: -76.9411617,
    referer: null,
    referrer: "mekecwiw",
    source: "segment",
    url: "http://sikec.com/ateseoki",
    event: "Viewed Checkout Step",
    properties: {
      name: "zedwel",
      value: 401861146732.1344
    }
  }
];
const tests = [
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
    logs: [
      ["debug", "incoming.track.start", {}, { payload: trackPayload }],
      logTrack(expect)
    ],
    metrics: [INCREMENT_REQUEST, INCREMENT_TRACK],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [firehoseTrack(expect)]
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
    logs: [
      ["debug", "incoming.track.start", {}, { payload: trackPayload }],
      logTrack(expect)
    ],
    metrics: [INCREMENT_REQUEST, INCREMENT_TRACK],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [
      firehoseTrack(expect)
    ]
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
    logs: [
      ["debug", "incoming.track.start", {}, { payload: trackPayload }],
      logTrack(expect)
    ],
    metrics: [INCREMENT_REQUEST, INCREMENT_TRACK],
    response: { message: "thanks" },
    responseStatusCode: 200,
    firehoseEvents: [
      firehoseTrack(expect)
    ]
  }
];

export default tests;

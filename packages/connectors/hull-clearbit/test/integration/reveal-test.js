// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
import connectorConfig from "../../server/config";
import company from "../fixtures/company.json";
import company_attributes from "../fixtures/company-attributes.js";
import person from "../fixtures/person.json";

describe("Clearbit Reveal Tests", () => {
  const connector = {
    id: "123456789012345678901234",
    private_settings: {
      api_key: "123",
      reveal_user_segments: ["reveal"],
      reveal_user_segments_exclusion: ["exclusion"]
    }
  };
  const usersSegments = [
    { id: "reveal", name: "Users to Reveal" },
    { id: "exclusion", name: "Users to Skip" }
  ];
  const accountsSegments = [];
  const ANONYMOUS_USER = {
    id: "1234",
    anonymous_ids: ["foobar-anonymous"],
    email: null,
    last_known_ip: "100.0.0.0"
  };
  const REVEAL_SUCCESS_RESPONSE = {
    ip: "100.0.0.0",
    fuzzy: true,
    domain: "uber.com",
    company
  };
  const noOpResponse = {
    accountsSegments,
    usersSegments,
    handlerUrl: "smart-notifier",
    channel: "user:update",
    response: [],
    externalApiMock: () => {},
    response: {
      flow_control: {
        in: 5,
        in_time: 10,
        size: 10,
        type: "next"
      }
    },
    logs: [],
    firehoseEvents: [],
    metrics: [["increment", "connector.request", 1]],
    platformApiCalls: []
  };

  it("should properly reveal users and update account", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      connector,
      accountsSegments,
      usersSegments,
      response: [],
      messages: [
        {
          user: ANONYMOUS_USER,
          account: {},
          segments: [{ id: "reveal" }]
        }
      ],
      externalApiMock: () => {
        const scope = nock("https://reveal.clearbit.com");
        scope
          .get(/v1\/companies\/find/)
          .query({ ip: "100.0.0.0" })
          .reply(200, REVEAL_SUCCESS_RESPONSE);
        return scope;
      },
      response: {
        flow_control: {
          in: 5,
          in_time: 10,
          size: 10,
          type: "next"
        }
      },
      logs: [
        [
          "debug",
          "clearbit.start",
          expect.whatever(),
          {
            action: "reveal",
            params: { ip: "100.0.0.0" }
          }
        ],
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: true
                },
                revealResult: undefined
              }
            ]
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: { id: "1234", email: null },
            subjectType: "user"
          },
          {
            "clearbit/fetched_at": expect.whatever(),
            "clearbit/revealed_at": expect.whatever(),
            "clearbit/source": { value: "reveal", operation: "setIfNull" }
          }
        ],
        [
          "traits",
          {
            asAccount: {
              anonymous_id: "clearbit:3f5d6a4e-c284-4f78-bfdf-7669b45af907"
            },
            asUser: {
              id: "1234",
              email: null
            },
            subjectType: "account"
          },
          company_attributes(expect)
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "reveal", 1],
        ["increment", "ship.service_api.call", 1],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.accounts", 1]
      ],
      platformApiCalls: []
    })));

  it("should properly reveal users and update account if Segment whitelist === 'ALL'", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          reveal_user_segments: ["ALL"]
        }
      },
      accountsSegments,
      usersSegments,
      response: [],
      messages: [
        {
          user: ANONYMOUS_USER,
          account: {},
          segments: []
        }
      ],
      externalApiMock: () => {
        const scope = nock("https://reveal.clearbit.com");
        scope
          .get(/v1\/companies\/find/)
          .query({ ip: "100.0.0.0" })
          .reply(200, REVEAL_SUCCESS_RESPONSE);
        return scope;
      },
      response: {
        flow_control: {
          in: 5,
          in_time: 10,
          size: 10,
          type: "next"
        }
      },
      logs: [
        [
          "debug",
          "clearbit.start",
          expect.whatever(),
          {
            action: "reveal",
            params: { ip: "100.0.0.0" }
          }
        ],
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: true
                },
                revealResult: undefined
              }
            ]
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: { id: "1234", email: null },
            subjectType: "user"
          },
          {
            "clearbit/fetched_at": expect.whatever(),
            "clearbit/revealed_at": expect.whatever(),
            "clearbit/source": { value: "reveal", operation: "setIfNull" }
          }
        ],
        [
          "traits",
          {
            asAccount: {
              anonymous_id: "clearbit:3f5d6a4e-c284-4f78-bfdf-7669b45af907"
            },
            asUser: {
              id: "1234",
              email: null
            },
            subjectType: "account"
          },
          company_attributes(expect)
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "reveal", 1],
        ["increment", "ship.service_api.call", 1],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.accounts", 1]
      ],
      platformApiCalls: []
    })));

  it("should not reveal users if revealed_at has a value", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          user: { ...ANONYMOUS_USER, "traits_clearbit/revealed_at": "foo" },
          account: {},
          segments: []
        }
      ],
      logs: [
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "revealed_at present"
                },
                revealResult: false
              }
            ]
          }
        ]
      ]
    })));

  it("should not reveal users if we don't have an IP", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          user: { ...ANONYMOUS_USER, last_known_ip: undefined },
          account: {},
          segments: []
        }
      ],
      logs: [
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "Cannot reveal because missing IP"
                },
                revealResult: false
              }
            ]
          }
        ]
      ]
    })));

  it("should not reveal users if we have a clearbit company associated at account level", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      connector,
      accountsSegments,
      usersSegments,
      response: [],
      messages: [
        {
          user: ANONYMOUS_USER,
          account: { anonymous_ids: ["clearbit:foobar"] },
          segments: []
        }
      ],
      externalApiMock: () => {},
      response: {
        flow_control: {
          in: 5,
          in_time: 10,
          size: 10,
          type: "next"
        }
      },
      logs: [
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "User not in any Reveal segment whitelist"
                },
                revealResult: false
              }
            ]
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [["increment", "connector.request", 1]],
      platformApiCalls: []
    })));

  it("should not reveal users if not in segment whitelist", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          user: ANONYMOUS_USER,
          account: {},
          segments: []
        }
      ],
      logs: [
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "User not in any Reveal segment whitelist"
                },
                revealResult: false
              }
            ]
          }
        ]
      ]
    })));

  it("should not reveal users if Batch Job", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      is_export: true,
      messages: [
        {
          user: ANONYMOUS_USER,
          account: {},
          segments: [{ id: "reveal" }]
        }
      ],
      logs: [
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "Reveal doesn't work on Batch updates"
                },
                revealResult: false
              }
            ]
          }
        ]
      ]
    })));

  it("should not reveal users if in segment whitelist and blacklist ", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          user: ANONYMOUS_USER,
          account: {},
          segments: [{ id: "reveal" }, { id: "exclusion" }]
        }
      ],
      logs: [
        [
          "info",
          "outgoing.user.info",
          expect.whatever(),
          {
            actions: [
              {
                user_id: "1234",
                enrichAction: {
                  message: "Cannot Enrich because missing email",
                  should: false
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "User in Reveal segment blacklist"
                },
                revealResult: false
              }
            ]
          }
        ]
      ]
    })));
});

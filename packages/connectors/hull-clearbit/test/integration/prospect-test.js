// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
import connectorConfig from "../../server/config";
import company from "../fixtures/company.json";
import prospect_attributes from "../fixtures/prospect-attributes.js";
import person from "../fixtures/person.json";
import prospect from "../fixtures/prospect.json";

describe("Clearbit Prospector Tests", () => {
  const connector = {
    id: "123456789012345678901234",
    private_settings: {
      api_key: "123",
      prospect_account_segments: ["prospect"],
      prospect_account_segments_exclusion: ["exclusion"]
    }
  };
  const usersSegments = [];
  const accountsSegments = [
    { id: "prospect", name: "Accounts to Prospect" },
    { id: "exclusion", name: "Accounts to Skip" }
  ];
  const ACCOUNT = {
    id: "1234",
    anonymous_ids: ["foobar-anonymous"],
    domain: "foobar.com"
  };
  const PROSPECTOR_SUCCESS_RESPONSE = {
    page: 1,
    page_size: 5,
    total: 723,
    results: [prospect]
  };
  const noOpResponse = {
    accountsSegments,
    usersSegments,
    handlerUrl: "smart-notifier",
    channel: "account:update",
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

  it("should prospect domains and update account and users", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "prospect" }]
        }
      ],
      externalApiMock: () => {
        const scope = nock("https://prospector.clearbit.com");
        scope
          .get(/v1\/people\/search/)
          .query({ domain: "foobar.com", page: 1, page_size: 5 })
          .reply(200, PROSPECTOR_SUCCESS_RESPONSE);
        return scope;
      },
      logs: [
        [
          "debug",
          "clearbit.start",
          expect.whatever(),
          {
            action: "prospect",
            params: {
              domain: "foobar.com",
              page: 1,
              page_size: 5
            }
          }
        ],
        [
          "info",
          "outgoing.account.success",
          expect.whatever(),
          {
            query: {},
            source: "prospector",
            domain: "foobar.com",
            limit: 5,
            message: "Found 1 new Prospects",
            prospects: {
              "harlow@clearbit.com": prospect
            }
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: {
              anonymous_id: `clearbit-prospect:${prospect.id}`,
              email: prospect.email
            },
            asAccount: { id: "1234", domain: "foobar.com" },
            subjectType: "user"
          },
          prospect_attributes(expect)
        ],
        [
          "traits",
          {
            asAccount: { id: "1234", domain: "foobar.com" },
            subjectType: "account"
          },
          {
            "clearbit/prospected_users": { operation: "increment", value: 1 },
            "clearbit/fetched_at": expect.whatever(),
            "clearbit/prospected_at": expect.whatever(),
            "clearbit/source": { value: "prospector", operation: "setIfNull" }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "prospect", 1],
        ["increment", "ship.service_api.call", 1],
        ["increment", "ship.incoming.users", 1]
      ],
      platformApiCalls: []
    })));

  it("should prospect domains and update account and users if ALL segment defined", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          prospect_account_segments: ["ALL"]
        }
      },
      messages: [
        {
          account: ACCOUNT,
          account_segments: []
        }
      ],
      externalApiMock: () => {
        const scope = nock("https://prospector.clearbit.com");
        scope
          // .log(console.log)
          .get(/v1\/people\/search/)
          .query({ domain: "foobar.com", page: 1, page_size: 5 })
          .reply(200, PROSPECTOR_SUCCESS_RESPONSE);
        return scope;
      },
      logs: [
        [
          "debug",
          "clearbit.start",
          expect.whatever(),
          {
            action: "prospect",
            params: {
              domain: "foobar.com",
              page: 1,
              page_size: 5
            }
          }
        ],
        [
          "info",
          "outgoing.account.success",
          expect.whatever(),
          {
            query: {},
            source: "prospector",
            domain: "foobar.com",
            limit: 5,
            message: "Found 1 new Prospects",
            prospects: {
              "harlow@clearbit.com": prospect
            }
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: {
              anonymous_id: `clearbit-prospect:${prospect.id}`,
              email: prospect.email
            },
            asAccount: {
              "domain": "foobar.com",
              id: "1234"
            },
            subjectType: "user"
          },
          prospect_attributes(expect)
        ],
        [
          "traits",
          {
            asAccount: { id: "1234", domain: "foobar.com" },
            subjectType: "account"
          },
          {
            "clearbit/prospected_users": { operation: "increment", value: 1 },
            "clearbit/fetched_at": expect.whatever(),
            "clearbit/prospected_at": expect.whatever(),
            "clearbit/source": { value: "prospector", operation: "setIfNull" }
          }
        ],
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "prospect", 1],
        ["increment", "ship.service_api.call", 1],
        ["increment", "ship.incoming.users", 1]
      ],
      platformApiCalls: []
    })));

  it("should not prospect accounts if they don't have a Domain", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          account: { anonymous_ids: ["1234"] },
          account_segments: [{ id: "prospect" }]
        }
      ]
    })));

  it("should not prospect accounts if not in segment whitelist", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          account: ACCOUNT,
          account_segments: []
        }
      ]
    })));

  it("should not prospect accounts if in segment whitelist and blacklist ", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "prospect" }, { id: "exclusion" }]
        }
      ]
    })));

  it("should not prospect accounts if ALL segment defined and in and blacklist ", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          prospect_account_segments: ["ALL"]
        }
      },
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "exclusion" }]
        }
      ]
    })));

  it("should not prospect accounts if Batch Job", async () =>
    testScenario({ connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      is_export: true,
      logs: [
        [
          "debug",
          "clearbit.start",
          expect.whatever(),
          {
            action: "enrich",
            params: expect.whatever()
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "enrich", 1],
        ["increment", "ship.service_api.call", 1]
      ],
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "prospect" }]
        }
      ]
    })));
});

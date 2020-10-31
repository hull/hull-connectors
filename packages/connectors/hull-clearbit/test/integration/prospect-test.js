// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";
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
        type: "next"
      }
    },
    logs: [],
    firehoseEvents: [],
    metrics: [["increment", "connector.request", 1]],
    platformApiCalls: []
  };

  it("should prospect domains and update account and users", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
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
          .get("/v1/people/search")
          .query({
            domain: "foobar.com",
            page: 1,
            page_size: 5,
            titles: { "": ["ceo", "head of marketing"] }
          })
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
              titles: ["ceo", "head of marketing"],
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
            query: {
              titles: ["ceo", "head of marketing"]
            },
            source: "prospector",
            domain: "foobar.com",
            limit: 5,
            message: "Found 1 new Prospects",
            prospects: {
              "harlow@clearbit.com": prospect
            }
          }
        ],
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  message: "No enrich segments defined for Account",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: true
                },
                prospectResult: expect.whatever()
              }
            ]
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
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
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
          .get("/v1/people/search")
          .query({
            domain: "foobar.com",
            page: 1,
            page_size: 5,
            titles: { "": ["ceo", "head of marketing"] }
          })
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
              titles: ["ceo", "head of marketing"],
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
            query: {
              titles: ["ceo", "head of marketing"]
            },
            source: "prospector",
            domain: "foobar.com",
            limit: 5,
            message: "Found 1 new Prospects",
            prospects: {
              "harlow@clearbit.com": prospect
            }
          }
        ],
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  message: "No enrich segments defined for Account",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: true
                },
                prospectResult: expect.whatever()
              }
            ]
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
              domain: "foobar.com",
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

  it("should support changing prospect domain and titles", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          prospect_account_segments: ["ALL"],
          lookup_domain: "other_domain",
          prospect_filter_titles: ["vp sales"]
        }
      },
      messages: [
        {
          account: {
            ...ACCOUNT,
            domain: "alt.com",
            other_domain: "foobar.com"
          },
          account_segments: []
        }
      ],
      externalApiMock: () => {
        const scope = nock("https://prospector.clearbit.com");
        scope
          // .log(console.log)
          .get("/v1/people/search")
          .query({
            domain: "foobar.com",
            page: 1,
            page_size: 5,
            titles: { "": "vp sales" }
          })
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
              titles: ["vp sales"],
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
            query: {
              titles: ["vp sales"]
            },
            source: "prospector",
            domain: "foobar.com",
            limit: 5,
            message: "Found 1 new Prospects",
            prospects: {
              "harlow@clearbit.com": prospect
            }
          }
        ],
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  message: "No enrich segments defined for Account",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: true
                },
                prospectResult: expect.whatever()
              }
            ]
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
              domain: "alt.com",
              id: "1234"
            },
            subjectType: "user"
          },
          prospect_attributes(expect)
        ],
        [
          "traits",
          {
            asAccount: { id: "1234", domain: "alt.com" },
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

  it("should support changing prospect role and seniority", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          prospect_account_segments: ["ALL"],
          lookup_domain: "other_domain",
          prospect_filter_roles: ["communications"],
          prospect_filter_cities: ["san francisco"],
          prospect_filter_states: ["california"],
          prospect_filter_seniorities: ["director"],
          prospect_filter_titles: ["vp sales"]
        }
      },
      messages: [
        {
          account: {
            ...ACCOUNT,
            domain: "alt.com",
            other_domain: "foobar.com"
          },
          account_segments: []
        }
      ],
      externalApiMock: () => {
        const scope = nock("https://prospector.clearbit.com");
        scope
          // .log(console.log)
          .get("/v1/people/search")
          .query({
            domain: "foobar.com",
            page: 1,
            page_size: 5,
            titles: { "": "vp sales" },
            cities: { "": "san francisco" },
            states: { "": "california" },
            roles: { "": "communications" },
            seniorities: { "": "director" }
          })
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
              titles: ["vp sales"],
              cities: ["san francisco"],
              states: ["california"],
              roles: ["communications"],
              seniorities: ["director"],
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
            query: {
              titles: ["vp sales"],
              cities: ["san francisco"],
              states: ["california"],
              roles: ["communications"],
              seniorities: ["director"]
            },
            source: "prospector",
            domain: "foobar.com",
            limit: 5,
            message: "Found 1 new Prospects",
            prospects: {
              "harlow@clearbit.com": prospect
            }
          }
        ],
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  message: "No enrich segments defined for Account",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: true
                },
                prospectResult: expect.whatever()
              }
            ]
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
              domain: "alt.com",
              id: "1234"
            },
            subjectType: "user"
          },
          prospect_attributes(expect)
        ],
        [
          "traits",
          {
            asAccount: { id: "1234", domain: "alt.com" },
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

  it("should not prospect accounts if they don't have a Domain", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          account: { anonymous_ids: ["1234"] },
          account_segments: [{ id: "prospect" }]
        }
      ],
      logs: [
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: undefined,
                enrichAction: {
                  message: "Cannot Enrich because missing domain",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: false,
                  message: "Can't find a domain"
                },
                prospectResult: false
              }
            ]
          }
        ]
      ]
    })));

  it("should not prospect accounts if not in segment whitelist", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          account: ACCOUNT,
          account_segments: []
        }
      ],
      logs: [
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  message: "No enrich segments defined for Account",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: false,
                  message: "Account not in any Prospect segment whitelist"
                },
                prospectResult: false
              }
            ]
          }
        ]
      ]
    })));

  it("should not prospect accounts if in segment whitelist and blacklist ", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector,
      logs: [
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  message: "No enrich segments defined for Account",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: false,
                  message: "Account in Prospect segment blacklist"
                },
                prospectResult: false
              }
            ]
          }
        ]
      ],
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "prospect" }, { id: "exclusion" }]
        }
      ]
    })));

  it("should not prospect accounts if ALL segment defined and in and blacklist ", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          prospect_account_segments: ["ALL"]
        }
      },
      logs: [
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  message: "No enrich segments defined for Account",
                  should: false
                },
                enrichResult: false,
                prospectAction: {
                  should: false,
                  message: "Account in Prospect segment blacklist"
                },
                prospectResult: false
              }
            ]
          }
        ]
      ],
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "exclusion" }]
        }
      ]
    })));

  it("should not prospect accounts if Batch Job", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpResponse,
      handlerType: handlers.notificationHandler,
      externalApiMock: () => {
        const scope = nock("https://company.clearbit.com");
        scope
          .get(/v2\/companies\/find/)
          .query(true)
          .reply(200, { company });
        return scope;
      },
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
        ],
        [
          "info",
          "outgoing.account.info",
          expect.whatever(),
          {
            actions: [
              {
                account_id: "1234",
                enrichAction: {
                  should: true
                },
                enrichResult: undefined,
                prospectAction: {
                  should: false,
                  message: "Prospector doesn't work on Batch updates"
                },
                prospectResult: false
              }
            ]
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asAccount: {
              anonymous_id: `clearbit:${company.id}`,
              domain: "foobar.com",
              id: "1234"
            },
            subjectType: "account"
          },
          expect.whatever()
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "enrich", 1],
        ["increment", "ship.service_api.call", 1],
        ["increment", "ship.incoming.accounts", 1]
      ],
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "prospect" }]
        }
      ]
    })));
});

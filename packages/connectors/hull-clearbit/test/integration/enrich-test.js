// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import moment from "moment";
const _ = require("lodash");
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";
import company from "../fixtures/company.json";
import company_attributes from "../fixtures/company-attributes.js";
import person_attributes from "../fixtures/person-attributes.js";
import person from "../fixtures/person.json";

describe("Clearbit Enrich Tests", () => {
  const connector = {
    id: "123456789012345678901234",
    private_settings: {
      api_key: "123",
      enrich_account_segments: ["enrich"],
      enrich_account_segments_exclusion: ["exclusion"],
      enrich_user_segments: ["enrich-users"],
      enrich_user_segments_exclusion: ["exclusion-users"]
    }
  };
  const usersSegments = [
    { id: "enrich-users", name: "Users to Enrich" },
    { id: "exclusion-users", name: "Users to Skip" }
  ];
  const accountsSegments = [
    { id: "enrich", name: "Accounts to Enrich" },
    { id: "exclusion", name: "Accounts to Skip" }
  ];
  const ANONYMOUS_USER = {
    id: "1234",
    anonymous_ids: ["foobar-anonymous"],
    email: null,
    last_known_ip: "100.0.0.0"
  };
  const EMAIL_USER = {
    id: "1234",
    email: "foo@bar.com",
    anonymous_ids: [],
    domain: "foobar.com"
  };
  const ACCOUNT = {
    id: "1234",
    anonymous_ids: ["bar-anonymous"],
    domain: "bar.com"
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
  const noOpUserResponse = {
    ...noOpResponse,
    channel: "user:update"
  };
  const noOpAccountResponse = {
    ...noOpResponse,
    channel: "account:update"
  };
  const enrichUserResponse = (nock, expect, subscribe = true) => ({
    ...noOpUserResponse,
    externalApiMock: () => {
      const scope = nock("https://person.clearbit.com");
      scope
        .get(/v2\/combined\/find/)
        .query(true)
        .reply(200, { person, company });
      return scope;
      // person.clearbit.com:443/v2/combined/find?email[]=foo%40bar.com&given_name=&family_name=&webhook_url=https%3A%2F%2Flocalhost%2Fclearbit-enrich%3Ftoken%3Dab4LzEe006CGPAFbgBxXi2z2G5vzW2Wd2Md9BOIIfUBwJPSzSEogY4d4jOtqBGrlFrgjpB7NoSk4lmF6c2H2r0h6%252Fk56RDbYT36m2qVrFdo%253D&webhook_id=1234&subscribe=true
    },
    firehoseEvents: [
      [
        "traits",
        {
          asUser: {
            anonymous_id: `clearbit:${person.id}`,
            email: EMAIL_USER.email,
            id: "1234"
          },
          subjectType: "user"
        },
        person_attributes(expect, "enrich")
      ],
      [
        "traits",
        {
          asAccount: {
            anonymous_id: `clearbit:${company.id}`
          },
          asUser: {
            anonymous_id: `clearbit:${person.id}`,
            email: EMAIL_USER.email,
            id: "1234"
          },
          subjectType: "account"
        },
        company_attributes(expect, "enrich")
      ]
    ],
    logs: [
      [
        "debug",
        "clearbit.start",
        expect.whatever(),
        {
          action: "enrich",
          params: {
            email: EMAIL_USER.email,
            family_name: undefined,
            given_name: undefined,
            subscribe,
            webhook_id: "1234:",
            webhook_url: expect.whatever()
          }
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
                should: true
              },
              enrichResult: undefined,
              revealAction: {
                should: false,
                message: "No reveal Segments enabled"
              },
              revealResult: false
            }
          ]
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "enrich", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.users", 1],
      ["increment", "ship.incoming.accounts", 1]
    ]
  });
  const enrichWebhookResponse = (nock, expect, subscribe = true) => ({
    ...enrichUserResponse(nock, expect, subscribe),
    firehoseEvents: [
      [
        "traits",
        {
          asUser: {
            anonymous_id: `clearbit:${person.id}`,
            email: EMAIL_USER.email,
            id: "1234"
          },
          subjectType: "user"
        },
        {
          "clearbit/enriched_at": expect.whatever(),
          source: {
            operation: "setIfNull",
            value: "enrich"
          }
        }
      ],
      [
        "traits",
        {
          asAccount: {
            anonymous_id: `clearbit:${company.id}`
          },
          asUser: {
            anonymous_id: `clearbit:${person.id}`,
            email: EMAIL_USER.email,
            id: "1234"
          },
          subjectType: "account"
        },
        {
          "clearbit/enriched_at": expect.whatever(),
          source: {
            operation: "setIfNull",
            value: "enrich"
          }
        }
      ]
    ],
  });

  const enrichAccountResponse = (nock, expect, subscribe = true) => ({
    ...noOpAccountResponse,
    externalApiMock: () => {
      const scope = nock("https://company.clearbit.com");
      scope
        .get(/v2\/companies\/find/)
        .query(true)
        .reply(200, { company });
      return scope;
      // person.clearbit.com:443/v2/combined/find?email[]=foo%40bar.com&given_name=&family_name=&webhook_url=https%3A%2F%2Flocalhost%2Fclearbit-enrich%3Ftoken%3Dab4LzEe006CGPAFbgBxXi2z2G5vzW2Wd2Md9BOIIfUBwJPSzSEogY4d4jOtqBGrlFrgjpB7NoSk4lmF6c2H2r0h6%252Fk56RDbYT36m2qVrFdo%253D&webhook_id=1234&subscribe=true
    },
    firehoseEvents: [
      [
        "traits",
        {
          asAccount: {
            id: ACCOUNT.id,
            domain: ACCOUNT.domain,
            anonymous_id: `clearbit:${company.id}`
          },
          subjectType: "account"
        },
        company_attributes(expect, "enrich")
      ]
    ],
    logs: [
      [
        "debug",
        "clearbit.start",
        expect.whatever(),
        {
          action: "enrich",
          params: {
            domain: "bar.com",
            company_name: undefined,
            subscribe,
            webhook_id: ":1234",
            webhook_url: expect.whatever()
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
                should: true
              },
              enrichResult: undefined,
              prospectAction: {
                should: false,
                message: "Account not in any Prospect segment whitelist"
              },
              prospectResult: false
            }
          ]
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "enrich", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.accounts", 1]
    ]
  });

  it("should enrich user", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...enrichUserResponse(nock, expect, false),
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings
        }
      },
      messages: [
        {
          user: EMAIL_USER,
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));

  it("should enrich account", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...enrichAccountResponse(nock, expect, false),
      handlerType: handlers.notificationHandler,
      connector,
      messages: [
        {
          account: ACCOUNT,
          account_segments: [{ id: "enrich" }]
        }
      ]
    })));

  it("should re-enrich user if enrich_refresh enabled", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...enrichUserResponse(nock, expect),
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          enrich_refresh: true
        }
      },
      messages: [
        {
          user: {
            ...EMAIL_USER,
            "traits_clearbit/enriched_at": moment()
              .subtract(10, "days")
              .toISOString()
          },
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));

  it("should enrich user if lookup>1h", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...enrichUserResponse(nock, expect),
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          enrich_refresh: true
        }
      },
      messages: [
        {
          user: {
            ...EMAIL_USER,
            "traits_clearbit/enriched_at": moment()
              .subtract(2, "hours")
              .toISOString()
          },
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));

  it("should not enrich users if not in segments", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpUserResponse,
      handlerType: handlers.notificationHandler,
      connector,
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
                  should: false,
                  message:
                    "Enrich Segments are defined but User isn't in any of them"
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "No reveal Segments enabled"
                },
                revealResult: false
              }
            ]
          }
        ]
      ],
      metrics: [["increment", "connector.request", 1]],
      messages: [
        {
          user: EMAIL_USER,
          account: {},
          segments: []
        }
      ]
    })));

  it("should not enrich users if in Blacklisted segments", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpUserResponse,
      handlerType: handlers.notificationHandler,
      connector,
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
                  should: false,
                  message: "User is in Enrichment blacklist"
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "No reveal Segments enabled"
                },
                revealResult: false
              }
            ]
          }
        ]
      ],
      metrics: [["increment", "connector.request", 1]],
      messages: [
        {
          user: EMAIL_USER,
          account: {},
          segments: [{ id: "enrich-users" }, { id: "exclusion-users" }]
        }
      ]
    })));

  it("should not enrich users if no email", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpUserResponse,
      handlerType: handlers.notificationHandler,
      connector,
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
                  should: false,
                  message: "Cannot Enrich because missing email"
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "No reveal Segments enabled"
                },
                revealResult: false
              }
            ]
          }
        ]
      ],
      metrics: [["increment", "connector.request", 1]],
      messages: [
        {
          user: ANONYMOUS_USER,
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));

  it("should not enrich user enrich refresh disabled", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpUserResponse,
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          enrich_refresh: false
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
                  should: false,
                  message: "enriched_at present and refresh disabled"
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "No reveal Segments enabled"
                },
                revealResult: false
              }
            ]
          }
        ]
      ],
      metrics: [["increment", "connector.request", 1]],
      messages: [
        {
          user: {
            ...EMAIL_USER,
            "traits_clearbit/enriched_at": moment()
              .subtract(10, "days")
              .toISOString()
          },
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));

  it("should handle Webhook responses properly", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...enrichUserResponse(nock, expect),
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          enrich_refresh: true
        }
      },
      messages: [
        {
          user: {
            ...EMAIL_USER
          },
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));

  it("should not enrich user if pending lookup", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpUserResponse,
      handlerType: handlers.notificationHandler,
      connector,
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
                  should: false,
                  message: "Waiting for webhook"
                },
                enrichResult: false,
                revealAction: {
                  should: false,
                  message: "No reveal Segments enabled"
                },
                revealResult: false
              }
            ]
          }
        ]
      ],
      metrics: [["increment", "connector.request", 1]],
      messages: [
        {
          user: {
            ...EMAIL_USER,
            "traits_clearbit/enriched_at": moment()
              .subtract(30, "minutes")
              .toISOString()
          },
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));

  it("should handle invalid email errors", async () =>
    testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => ({
      ...noOpUserResponse,
      externalApiMock: () => {
        const scope = nock("https://person.clearbit.com");
        scope
          .get(/v2\/combined\/find/)
          .query(true)
          .reply(422, {
            error: {
              message: "Invalid email.",
              type: "email_invalid"
            }
          });
        return scope;
        // person.clearbit.com:443/v2/combined/find?email[]=foo%40bar.com&given_name=&family_name=&webhook_url=https%3A%2F%2Flocalhost%2Fclearbit-enrich%3Ftoken%3Dab4LzEe006CGPAFbgBxXi2z2G5vzW2Wd2Md9BOIIfUBwJPSzSEogY4d4jOtqBGrlFrgjpB7NoSk4lmF6c2H2r0h6%252Fk56RDbYT36m2qVrFdo%253D&webhook_id=1234&subscribe=true
      },
      firehoseEvents: [],
      logs: [
        [
          "debug",
          "clearbit.start",
          expect.whatever(),
          {
            action: "enrich",
            params: {
              email: "foo@bar.com",
              family_name: undefined,
              given_name: undefined,
              subscribe: true,
              webhook_id: "1234:",
              webhook_url: expect.whatever()
            }
          }
        ],
        [
          "error",
          "outgoing.user.error",
          expect.whatever(),
          {
            error: {
              message: "Invalid email.",
              type: "email_invalid"
            }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "enrich", 1],
        ["increment", "ship.service_api.call", 1]
      ],
      handlerType: handlers.notificationHandler,
      connector: {
        ...connector,
        private_settings: {
          ...connector.private_settings,
          enrich_refresh: true
        }
      },
      messages: [
        {
          user: {
            ...EMAIL_USER,
            "traits_clearbit/fetched_at": moment()
              .subtract(2, "hours")
              .toISOString()
          },
          account: {},
          segments: [{ id: "enrich-users" }]
        }
      ]
    })));
});

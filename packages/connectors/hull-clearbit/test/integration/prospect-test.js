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
            asAccount: { id: "1234", domain: "foobar.com" },
            subjectType: "account"
          },
          {
            "clearbit/prospected_at": {
              operation: "setIfNull",
              value: expect.whatever()
            },
            "clearbit/source": { value: "prospector", operation: "setIfNull" }
          }
        ],
        [
          "traits",
          {
            asUser: {
              anonymous_id: `clearbit-prospect:${prospect.id}`,
              email: prospect.email
            },
            subjectType: "user"
          },
          prospect_attributes(expect)
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
          .log(console.log)
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
            asAccount: { id: "1234", domain: "foobar.com" },
            subjectType: "account"
          },
          {
            "clearbit/prospected_at": {
              operation: "setIfNull",
              value: expect.whatever()
            },
            "clearbit/source": { value: "prospector", operation: "setIfNull" }
          }
        ],
        [
          "traits",
          {
            asUser: {
              anonymous_id: `clearbit-prospect:${prospect.id}`,
              email: prospect.email
            },
            subjectType: "user"
          },
          prospect_attributes(expect)
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

  // const mocks = mockr({
  //   server,
  //   beforeEach,
  //   afterEach,
  //   port: 8000,
  //   segments: [{ id: "1", name: "A" }]
  // });
  //
  // it("should prospect properly with accounts enabled", done => {
  //   const clearbit = mocks
  //     .nock("https://prospector.clearbit.com")
  //     .get("/v1/people/search")
  //     .query({
  //       domain: "domain.com",
  //       limit: 2,
  //       email: true,
  //       title: "foo"
  //     })
  //     .reply(200, [{ email: "foo@foo.bar", id: "foobar" }]);
  //
  //   mocks.minihull.stubApp("/api/v1/search/user_reports").respond({
  //     pagination: { total: 2 },
  //     aggregations: {
  //       without_email: {
  //         doc_count: 2
  //       },
  //       by_source: {
  //         buckets: [{ key: "prospect", doc_count: 2 }]
  //       }
  //     }
  //   });
  //   mocks.minihull.userUpdate(
  //     {
  //       connector: {
  //         id: "123456789012345678901234",
  //         private_settings: {
  //           api_key: "123",
  //           prospect_enabled: true,
  //           prospect_segments: ["1"],
  //           prospect_filter_titles: ["foo"],
  //           prospect_limit_count: 2
  //         }
  //       },
  //       messages: [
  //         {
  //           user: { id: "abc", "traits/clearbit/source": "prospect" },
  //           account: { id: "ACCOUNTID", domain: "domain.com" },
  //           segments: [{ id: "1" }]
  //         }
  //       ]
  //     },
  //     ({ batch, logs }) => {
  //       try {
  //         const [first, second, third, fourth] = _.sortBy(batch, "type");
  //         const [, firstLog, secondLog, thirdLog, fourthLog, fifthLog] = logs;
  //
  //         expect(batch.length).to.equal(4);
  //         expect(logs.length).to.equal(6);
  //
  //         // Source user Event
  //         expect(first.type).to.equal("track");
  //         expect(first.body.properties.emails[0]).to.equal("foo@foo.bar");
  //         expect(first.body.properties.found).to.equal(1);
  //         expect(first.body.event).to.equal("Clearbit Prospector Triggered");
  //         expect(first.claims.sub).to.equal("abc");
  //
  //         // Source user call
  //         expect(second.type).to.equal("traits");
  //         expect(second.body["clearbit/prospected_at"].operation).to.equal(
  //           "setIfNull"
  //         );
  //         expect(second.body["clearbit/prospected_at"].value).to.not.be.null;
  //         expect(second.claims.sub).to.equal("abc");
  //
  //         // New Prospect Call
  //         expect(third.type).to.equal("traits");
  //         expect(third.body.email.value).to.equal("foo@foo.bar");
  //         expect(third.body["clearbit/prospected_at"].value).to.not.be.null;
  //         expect(third.body["clearbit/source"].value).to.equal("prospector");
  //         expect(third.body["clearbit/prospected_from"].value).to.equal("abc");
  //         expect(third.body["clearbit/source"].value).to.equal("prospector");
  //         expect(third.claims["io.hull.subjectType"]).to.equal("user");
  //         expect(third.claims["io.hull.asUser"].email).to.equal("foo@foo.bar");
  //         expect(third.claims["io.hull.asUser"].anonymous_id).to.equal(
  //           "clearbit-prospect:foobar"
  //         );
  //
  //         // Account Call
  //         expect(fourth.type).to.equal("traits");
  //         expect(fourth.body["clearbit/prospected_at"].value).to.not.be.null;
  //         expect(fourth.body["clearbit/source"].value).to.equal("prospector");
  //         expect(fourth.body["clearbit/prospected_from"].value).to.equal("abc");
  //         expect(fourth.body["clearbit/source"].value).to.equal("prospector");
  //         expect(fourth.claims["io.hull.subjectType"]).to.equal("account");
  //         expect(fourth.claims["io.hull.asUser"].email).to.equal("foo@foo.bar");
  //         expect(fourth.claims["io.hull.asAccount"].id).to.equal("ACCOUNTID");
  //
  //         expect(firstLog.message).to.equal("outgoing.account.start");
  //         expect(secondLog.message).to.equal("outgoing.user.start");
  //         expect(thirdLog.message).to.equal("outgoing.user.success");
  //         expect(fourthLog.message).to.equal("incoming.user.success");
  //         expect(fifthLog.message).to.equal("incoming.account.success");
  //
  //         clearbit.done();
  //         done();
  //       } catch (e) {
  //         throw new Error(e);
  //       }
  //     }
  //   );
  // });
  //
  // it("should handle automatic prospection", done => {
  //   const clearbit = mocks
  //     .nock("https://prospector.clearbit.com")
  //     .get("/v1/people/search")
  //     .query({
  //       domain: "foo.bar",
  //       limit: 2,
  //       email: true,
  //       title: "foo"
  //     })
  //     .reply(200, [{ email: "foo@foo.bar", id: "1234Clearbit" }]);
  //
  //   mocks.minihull.stubApp("/api/v1/search/user_reports").respond({
  //     pagination: { total: 1 },
  //     aggregations: {
  //       without_email: {
  //         doc_count: 1
  //       },
  //       by_source: {
  //         buckets: [{ key: "prospect", doc_count: 1 }]
  //       }
  //     }
  //   });
  //
  //   mocks.minihull.userUpdate(
  //     {
  //       connector: {
  //         id: "123456789012345678901234",
  //         private_settings: {
  //           api_key: "123",
  //           prospect_enabled: true,
  //           prospect_segments: ["1"],
  //           prospect_filter_titles: ["foo"],
  //           prospect_limit_count: 2,
  //           reveal_prospect_min_contacts: 1
  //         }
  //       },
  //       messages: [
  //         {
  //           user: {
  //             id: "abc",
  //             domain: "foo.bar",
  //             "traits/clearbit/source": "reveal"
  //           },
  //           segments: [{ id: "1" }]
  //         }
  //       ]
  //     },
  //     ({ batch, logs }) => {
  //       try {
  //         const [first, second, third, fourth] = _.sortBy(batch, "type");
  //         expect(batch.length).to.equal(4);
  //
  //         expect(first.type).to.equal("track");
  //         expect(first.claims["io.hull.subjectType"]).to.equal("user");
  //         expect(first.claims["io.hull.asUser"].id).to.equal("abc");
  //         expect(first.body.properties.emails[0]).to.equal("foo@foo.bar");
  //         expect(first.body.properties.found).to.equal(1);
  //         expect(first.body.event).to.equal("Clearbit Prospector Triggered");
  //
  //         expect(second.type).to.equal("traits");
  //         expect(second.claims["io.hull.subjectType"]).to.equal("user");
  //         expect(second.claims["io.hull.asUser"].id).to.equal("abc");
  //         expect(second.body["clearbit/prospected_at"].value).to.not.be.null;
  //
  //         expect(third.type).to.equal("traits");
  //         expect(third.claims["io.hull.subjectType"]).to.equal("user");
  //         expect(third.claims["io.hull.asUser"].email).to.equal("foo@foo.bar");
  //         expect(third.claims["io.hull.asUser"].anonymous_id).to.equal(
  //           "clearbit-prospect:1234Clearbit"
  //         );
  //         expect(third.body["clearbit/prospect_id"]).to.equal("1234Clearbit");
  //         expect(third.body["clearbit/prospected_at"].operation).to.equal(
  //           "setIfNull"
  //         );
  //         expect(third.body["clearbit/prospected_from"].value).to.equal("abc");
  //         expect(third.body["clearbit/source"].value).to.equal("prospector");
  //
  //         expect(fourth.type).to.equal("traits");
  //         expect(fourth.claims["io.hull.subjectType"]).to.equal("account");
  //         expect(fourth.claims["io.hull.asUser"].email).to.equal("foo@foo.bar");
  //         expect(fourth.claims["io.hull.asUser"].anonymous_id).to.equal(
  //           "clearbit-prospect:1234Clearbit"
  //         );
  //         expect(fourth.body["clearbit/prospected_at"].value).to.not.be.null;
  //         expect(fourth.body["clearbit/prospected_from"].value).to.equal("abc");
  //         expect(fourth.body["clearbit/source"].value).to.equal("prospector");
  //         clearbit.done();
  //         done();
  //       } catch (e) {
  //         console.log(e);
  //         throw new Error(e);
  //       }
  //     }
  //   );
  // });
  //
  // it("should respect limit setup", done => {
  //   const connector = {
  //     id: "123456789012345678901234",
  //     private_settings: {
  //       api_key: "123",
  //       prospect_enabled: true,
  //       prospect_segments: ["1"],
  //       prospect_filter_titles: ["foo", "bar", "zyx"],
  //       prospect_limit_count: 2
  //     }
  //   };
  //   mocks.minihull.stubConnector(connector);
  //
  //   mocks
  //     .nock("https://prospector.clearbit.com")
  //     .get("/v1/people/search")
  //     .query({
  //       domain: "foo.bar",
  //       limit: 2,
  //       email: true,
  //       title: "foo"
  //     })
  //     .reply(200, [{ email: "foo@foo.bar", id: "clearbit123" }])
  //     .get("/v1/people/search")
  //     .query({
  //       domain: "foo.bar",
  //       limit: 1,
  //       email: true,
  //       title: "bar"
  //     })
  //     .reply(200, [{ email: "foo@bar.bar", id: "clearbit456" }]);
  //
  //   const thirdTitleCall = mocks
  //     .nock("https://prospector.clearbit.com")
  //     .get("/v1/people/search")
  //     .query({
  //       domain: "foo.bar",
  //       limit: 2,
  //       email: true,
  //       title: "zyx"
  //     })
  //     .reply(200, [{ email: "foo@zyx.bar", id: "clearbit789" }]);
  //
  //   mocks.minihull.stubApp("/api/v1/search/user_reports").respond({
  //     pagination: { total: 1 },
  //     aggregations: {
  //       without_email: {
  //         doc_count: 1
  //       },
  //       by_source: {
  //         buckets: [{ key: "reveal", doc_count: 1 }]
  //       }
  //     }
  //   });
  //
  //   mocks.minihull.userUpdate(
  //     {
  //       connector,
  //       messages: [
  //         {
  //           user: { id: "abc", domain: "foo.bar" },
  //           account: {},
  //           segments: [{ id: "1" }]
  //         }
  //       ]
  //     },
  //     ({ batch, logs }) => {
  //       const [first, second, third, fourth, fifth] = _.sortBy(batch, "type");
  //       expect(batch.length).to.equal(6);
  //
  //       // Clearbit Prospector Triggered
  //       expect(first.type).to.equal("track");
  //       expect(first.body.properties.emails[0]).to.equal("foo@foo.bar");
  //       expect(first.body.properties.emails[1]).to.equal("foo@bar.bar");
  //       expect(first.body.properties.found).to.equal(2);
  //       expect(first.body.event).to.equal("Clearbit Prospector Triggered");
  //       expect(first.claims["io.hull.subjectType"]).to.equal("user");
  //       expect(first.claims["io.hull.asUser"].id).to.equal("abc");
  //
  //       // Source user trait
  //       expect(second.type).to.equal("traits");
  //       expect(second.body["clearbit/prospected_at"].value).to.not.be.null;
  //       expect(second.claims["io.hull.subjectType"]).to.equal("user");
  //       expect(second.claims["io.hull.asUser"].id).to.equal("abc");
  //
  //       // Accounts trait
  //       // Setting traits on first prospected email
  //       expect(third.type).to.equal("traits");
  //       expect(third.body.email.value).to.equal("foo@foo.bar");
  //       expect(third.body["clearbit/prospected_at"].value).to.not.be.null;
  //       expect(third.body["clearbit/prospected_from"].value).to.equal("abc");
  //       expect(third.claims["io.hull.subjectType"]).to.equal("user");
  //       expect(third.claims["io.hull.asUser"].anonymous_id).to.equal(
  //         "clearbit-prospect:clearbit123"
  //       );
  //       expect(third.claims["io.hull.asUser"].email).to.equal("foo@foo.bar");
  //
  //       expect(fourth.type).to.equal("traits");
  //       expect(fourth.body["clearbit/prospected_at"].value).to.not.be.null;
  //       expect(fourth.body["clearbit/prospected_from"].value).to.equal("abc");
  //       expect(fourth.body["clearbit/source"].value).to.equal("prospector");
  //       expect(fourth.claims["io.hull.subjectType"]).to.equal("account");
  //       expect(fourth.claims["io.hull.asUser"].email).to.equal("foo@foo.bar");
  //
  //       // Setting traits on second prospected email
  //       expect(fifth.type).to.equal("traits");
  //       expect(fifth.body.email.value).to.equal("foo@bar.bar");
  //       expect(fifth.body["clearbit/prospected_at"].value).to.not.be.null;
  //       expect(fifth.body["clearbit/prospected_from"].value).to.equal("abc");
  //       expect(fifth.body["clearbit/source"].value).to.equal("prospector");
  //       expect(fifth.claims["io.hull.asUser"].anonymous_id).to.equal(
  //         "clearbit-prospect:clearbit456"
  //       );
  //       expect(fifth.claims["io.hull.asUser"].email).to.equal("foo@bar.bar");
  //
  //       expect(thirdTitleCall.isDone()).to.equal(false);
  //       done();
  //     }
  //   );
  // });
  //
  // it("should handle Rate limit error", done => {
  //   mocks
  //     .nock("https://prospector.clearbit.com")
  //     .get("/v1/people/search")
  //     .query({
  //       domain: "foo.baz",
  //       limit: 2,
  //       email: true,
  //       title: "foo"
  //     })
  //     .reply(409, { error: { message: "Your account is over it's quota" } });
  //
  //   mocks.minihull.stubApp("/api/v1/search/user_reports").respond({
  //     pagination: { total: 0 },
  //     aggregations: {
  //       without_email: {
  //         doc_count: 0
  //       },
  //       by_source: {
  //         buckets: []
  //       }
  //     }
  //   });
  //   mocks.minihull.userUpdate(
  //     {
  //       connector: {
  //         id: "123456789012345678901234",
  //         private_settings: {
  //           api_key: "123",
  //           prospect_enabled: true,
  //           prospect_segments: ["1"],
  //           prospect_filter_titles: ["foo"],
  //           prospect_limit_count: 2
  //         }
  //       },
  //       messages: [
  //         {
  //           user: {
  //             id: "abc",
  //             domain: "foo.bar"
  //           },
  //           segments: [{ id: "1" }]
  //         },
  //         {
  //           user: {
  //             id: "def",
  //             domain: "foo.baz"
  //           },
  //           segments: [{ id: "1" }]
  //         }
  //       ]
  //     },
  //     ({ batch, logs }) => {
  //       expect(batch.length).to.equal(0);
  //       done();
  //     }
  //   );
  // });
});

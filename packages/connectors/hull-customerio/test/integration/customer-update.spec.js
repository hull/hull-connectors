// @flow
/* global describe, it, beforeEach, afterEach */
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

it("should update customer", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        // Note: Customer.io returns an empty response body
        const scope = nock("https://track.customer.io");
        scope.put(/\/api\/v1\/customers\//).reply(200, {});
      },
      // connector: require(`./scenarios/customer-update/smart-notifier-payload`)().connector,
      // messages: [require(`./scenarios/customer-update/smart-notifier-payload`)().messages],
      connector: {
        private_settings: {
          user_id_mapping: "external_id",
          api_key: "bar",
          site_id: "foo",
          synchronized_segments: ["hullSegmentId"]
        }
      },
      messages: [
        {
          user: {
            external_id: "123",
            email: "email@email.com",
            "customerio/id": "customerCustomerio123"
          },
          segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      usersSegments: [
        {
          name: "testSegment",
          id: "hullSegmentId"
        }
      ],
      accountsSegments: [],
      response: {
        flow_control: { type: "next" }
      },
      logs: [
        [
          "debug",
          "sendUserMessages",
          { request_id: expect.whatever() },
          { toDelete: 0, toInsert: 1, toSkip: 0, toUpdate: 0 }
        ],
        [
          "debug",
          "connector.service_api.call",
          { request_id: expect.whatever() },
          {
            method: "PUT",
            responseTime: expect.any(Number),
            status: 200,
            url: "https://track.customer.io/api/v1/customers/{{id}}",
            vars: { id: "123" }
          }
        ],
        [
          "info",
          "outgoing.user.success",
          {
            request_id: expect.whatever(),
            subject_type: "user",
            user_external_id: "123"
          },
          {
            data: {
              created_at: expect.any(Number),
              email: "email@email.com",
              hull_segments: ["hullSegmentName"],
              id: "123"
            },
            operation: "updateCustomer"
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: { external_id: "123" },
            subjectType: "user"
          },
          {
            "customerio/created_at": expect.any(Number),
            "customerio/deleted_at": null,
            "customerio/hash": expect.whatever(),
            "customerio/id": "123",
            "customerio/synced_at": expect.whatever()
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: []
    };
  });
});

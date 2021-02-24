// @flow
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

const testScenario = require("hull-connector-framework/src/test-scenario");
const companyPropertyGroups = require("../fixtures/get-properties-companies-groups");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_account_segments: ["hullSegmentId"],
    outgoing_account_attributes: [
      { hull: "name", service: "name", overwrite: true },
      { "hull": "account_segments.name[]", "service": "hull_segments", "overwrite": true }
    ],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const accountsSegments = [{ name: "testSegment", id: "hullSegmentId" }];

it("should send out a new hull account to hubspot found existing", () => {
  const domain = "hull.io";
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true").reply(200, []);
        scope
          .get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, companyPropertyGroups);
        scope
          .post("/companies/v2/domains/hull.io/companies", {
            requestOptions: {
              properties: ["domain", "hs_lastmodifieddate", "name"]
            }
          })
          .reply(200, require("../fixtures/post-companies-domains-companies"));
        scope
          .post("/companies/v1/batch-async/update?auditId=Hull", [
            {
              properties: [
                { name: "name", value: "New Name" },
                { name: "hull_segments", value: "testSegment" },
                { name: "domain", value: "hull.io" }
              ],
              objectId: "184896670"
            }
          ])
          .reply(202);
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments,
      messages: [
        {
          changes: {
            is_new: false,
            user: {},
            account: {
              name: [
                "old",
                "New Name"
              ]
            },
            segments: {},
            account_segments: {}
          },
          account: {
            domain,
            name: "New Name",
            id: "1"
          },
          account_segments: [{ id: "hullSegmentId", name: "testSegment" }]
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.whatever()
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.whatever()
        ],
        [
          "debug",
          "outgoing.job.start",
          expect.whatever(),
          { toInsert: 1, toSkip: 0, toUpdate: 0 }
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "POST",
            status: 200,
            url: "/companies/v2/domains/{{domain}}/companies",
            vars: { domain: "hull.io" }
          })
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "POST",
            status: 202,
            url: "/companies/v1/batch-async/update"
          })
        ],
        [
          "info",
          "outgoing.account.success",
          expect.objectContaining({
            subject_type: "account",
            account_domain: domain
          }),
          {
            hubspotWriteCompany: {
              properties: [
                {
                  name: "name",
                  value: "New Name"
                },
                {
                  name: "hull_segments",
                  value: "testSegment"
                },
                {
                  name: "domain",
                  value: "hull.io"
                }
              ],
              objectId: "184896670"
            },
            operation: "update"
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: []
    };
  });
});

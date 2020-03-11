// @flow
import connectorConfig from "../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_account_segments: ["hullSegmentId"],
    outgoing_account_attributes: [
      { hull: "name", service: "name", overwrite: true }
    ],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const accountsSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should send out a new hull account to hubspot update validation error", () => {
  const domain = "hull.io";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true").reply(200, []);
        scope
          .get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope
          .post("/companies/v1/batch-async/update?auditId=Hull", [
            {
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
              objectId: "companyHubspotId123"
            },
            {
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
                  value: "non-existing.com"
                }
              ],
              objectId: "companyObjectIdNonExisting"
            }
          ])
          .reply(
            400,
            require("../fixtures/post-companies-update-nonexisting-property")
          );
        scope
          .post("/companies/v1/batch-async/update?auditId=Hull", [
            {
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
              objectId: "companyHubspotId123"
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
            "hubspot/id": "companyHubspotId123"
          },
          account_segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        },
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
            domain: "non-existing.com",
            name: "New Name",
            "hubspot/id": "companyObjectIdNonExisting"
          },
          account_segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
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
          { toInsert: 0, toSkip: 0, toUpdate: 2 }
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "POST",
            status: 400,
            url: "/companies/v1/batch-async/update"
          })
        ],
        [
          "error",
          "outgoing.account.error",
          expect.objectContaining({
            account_domain: "non-existing.com",
            subject_type: "account"
          }),
          {
            error: 'Property "non-existing-property" does not exist',
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
                  value: "non-existing.com"
                }
              ],
              objectId: "companyObjectIdNonExisting"
            }
          }
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
            account_domain: "hull.io"
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
              objectId: "companyHubspotId123"
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
        ["increment", "connector.service_api.error", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});

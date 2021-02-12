// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

const connector = {
  private_settings: {
    api_key: "abcdfghaygfai17285",
    enriched_user_segments: ["59f09bc7f9c5a94af600076d"]
  }
};
const usersSegments = [
  {
    name: "Madkudu User",
    id: "59f09bc7f9c5a94af600076d"
  }
];

describe("User Enrichment Tests", () => {
  it("should not enrich user if enrichment disabled", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {},
          connector: {
            private_settings: {
              api_key: "abcdfghaygfai17285",
              enriched_user_segments: []
            }
          },
          usersSegments,
          accountsSegments: [],
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              user: {
                email: "bob@madkudu.com",
                name: "Bob"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu User"
                }
              ]
            }
          ],
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
      }
    );
  });

  it("should not enrich user if not in enrichment segment", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {},
          connector: {
            private_settings: {
              api_key: "abcdfghaygfai17285",
              enriched_user_segments: ["somesegment"]
            }
          },
          usersSegments,
          accountsSegments: [],
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              user: {
                email: "bob@madkudu.com",
                name: "Bob"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu User"
                }
              ]
            }
          ],
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
      }
    );
  });

  it("should not enrich user due to missing api key", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {},
          connector: {
            private_settings: {
              enriched_user_segments: ["59f09bc7f9c5a94af600076d"]
            }
          },
          usersSegments,
          accountsSegments: [],
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              user: {
                email: "bob@madkudu.com",
                name: "Bob"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu User"
                }
              ]
            }
          ],
          response: {
            flow_control: {
              type: "retry",
              size: 10,
              in: 6000,
              in_time: 10
            },
            error: {
              message: "No API Key available",
              name: "ConfigurationError",
              code: "HULL_ERR_CONFIGURATION"
            }
          },
          logs: [],
          firehoseEvents: [],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "connector.transient_error", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should enrich user", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {
            const scope = nock("https://api.madkudu.com/v1");

            scope.get("/persons?email=bob@madkudu.com").reply(200, {
              email: "bob@madkudu.com",
              object_type: "person",
              properties: {
                domain: "madkudu.com"
              }
            });

            return scope;
          },
          connector,
          usersSegments,
          accountsSegments: [],
          messages: [
            {
              message_id:
                "QBJMOAFESVMrQwsqWBFOBCEhPjA-RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIDBU8CKF15MUU_QVhwaFENGXJ9YHNoWUdSV0MGLFdRGAdoTm11JW8JHnV7ZHZtUxIDAEdXd3f_0o6vs8xOZiU9XhJLLD5-MzRFQV4",
              user: {
                email: "bob@madkudu.com",
                name: "Bob"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Madkudu User"
                }
              ]
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
              {
                request_id: expect.whatever()
              },
              {
                responseTime: expect.whatever(),
                method: "GET",
                url: "https://api.madkudu.com/v1/persons",
                status: 200
              }
            ],
            [
              "info",
              "incoming.user.progress",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_email: "bob@madkudu.com"
              },
              {
                action: "enrichment",
                data: {
                  email: "bob@madkudu.com",
                  object_type: "person",
                  properties: {
                    domain: "madkudu.com"
                  }
                }
              }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asUser: {
                  email: "bob@madkudu.com"
                },
                subjectType: "user"
              },
              {
                "madkudu/domain": "madkudu.com"
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "connector.service_api.response_time", expect.whatever()]
          ],
          platformApiCalls: []
        };
      }
    );
  });
});

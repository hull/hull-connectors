// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Upsert Contact Tests", () => {

  it("should upsert a contact", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        connector: {
          private_settings: {
            webhook_id: "1",
            tag_companies: true,
            api_key: "abc",
            api_host: "api-us.freshsuccess.com",
            synchronized_user_segments: ["segment_1"],
            outgoing_user_attributes: [
              {
                "hull": "account.external_id",
                "service": "account_id"
              },
              {
                "hull": "external_id",
                "service": "user_id"
              },
              {
                "hull": "first_name",
                "service": "first_name"
              },
              {
                "hull": "last_name",
                "service": "last_name"
              },
              {
                "hull": "source_is_primary",
                "service": "is_primary"
              },
              {
                "hull": "phone",
                "service": "phone"
              },
              {
                "hull": "email",
                "service": "email"
              },
              {
                "hull": "salutation",
                "service": "salutation"
              },
              {
                "hull": "title",
                "service": "title"
              },
              {
                "hull": "role",
                "service": "role"
              },
              {
                "hull": "department",
                "service": "department"
              },
              {
                "hull": "lead_source",
                "service": "lead_source"
              },
              {
                "hull": "mailing_street",
                "service": "mailing_street"
              },
              {
                "hull": "mailing_city",
                "service": "mailing_city"
              },
              {
                "hull": "mailing_state",
                "service": "mailing_state"
              },
              {
                "hull": "mailing_postal_code",
                "service": "mailing_postal_code"
              },
              {
                "hull": "mailing_country",
                "service": "mailing_country"
              },
              {
                "hull": "source",
                "service": "source"
              },
              {
                "hull": "is_active",
                "service": "is_active"
              },
              {
                "hull": "email_opt_out",
                "service": "email_opt_out"
              },

              // ARRAY HANDLING - build array of { key: "", value: "" }
              {
                "hull": "source_cld_1",
                "service": "custom_label_dimensions_cld_1"
              },
              {
                "hull": "source_cld_2",
                "service": "custom_label_dimensions.cld_2"
              },
              {
                "hull": "source_cld_3",
                "service": "custom_label_dimensions"
              },

              {
                "hull": "source_cvd_1",
                "service": "custom_value_dimensions_cvd_1"
              },
              {
                "hull": "source_cvd_2",
                "service": "custom_value_dimensions.cvd_2"
              },
              {
                "hull": "source_cvd_3",
                "service": "custom_value_dimensions"
              },

              {
                "hull": "source_ced_1",
                "service": "custom_event_dimensions_ced_1"
              },
              {
                "hull": "source_ced_2",
                "service": "custom_event_dimensions.ced_2"
              },
              {
                "hull": "source_ced_3",
                "service": "custom_event_dimensions"
              }
            ]
          }
        },
        accountSegments: [],
        usersSegments: [ { id: "segment_1", name: "Segment 1" }],
        externalApiMock: () => {
          const scope = nock("https://api-us.freshsuccess.com/api/v2");

          scope
            .post("/account_contacts?api_key=abc", {
              "records": [
                {
                  "custom_label_dimensions": [
                    {
                      "key": "cld_1",
                      "value": "cld_1_value"
                    },
                    {
                      "key": "cld_2",
                      "value": "cld_2_value"
                    }
                  ],
                  "custom_value_dimensions": [
                    {
                      "key": "cvd_1",
                      "value": 1.1
                    },
                    {
                      "key": "cvd_2",
                      "value": 2.1
                    }
                  ],
                  "custom_event_dimensions": [
                    {
                      "key": "ced_1",
                      "value": 1614367426004
                    },
                    {
                      "key": "ced_2",
                      "value": 1614367426005
                    }
                  ],
                  "account_id": "account_ex_id_0",
                  "user_id": "user_ex_id_0",
                  "first_name": "Bob",
                  "last_name": "Dole",
                  "phone": "+1 111 111 1111",
                  "email": "bob@rei.com",
                  "salutation": "mr"
                },
                {
                  "account_id": "account_ex_id_1",
                  "user_id": "user_ex_id_1"
                },
                {
                  "account_id": "account_ex_id_2",
                  "user_id": "user_ex_id_2"
                },
                {
                  "account_id": "account_ex_id_3",
                  "user_id": "user_ex_id_3"
                },
                {
                  "account_id": "account_ex_id_4",
                  "user_id": "user_ex_id_4"
                }
              ]
            })
            .reply(200, {
              "status_is_ok": false,
              "failed_results": [
                {
                  "message": "Account not found",
                  "account_id": "account_ex_id_1",
                  "user_id": "user_ex_id_1",
                  "record": 1
                },
                {
                  "message": "Account not found",
                  "account_id": "account_ex_id_3",
                  "user_id": "user_ex_id_3",
                  "record": 3
                }
              ]
            });

          scope
            .post("/account_contacts?api_key=abc", {
              "records": [
                {
                  "custom_label_dimensions": [
                    {
                      "key": "cld_1",
                      "value": "cld_1_value"
                    },
                    {
                      "key": "cld_2",
                      "value": "cld_2_value"
                    }
                  ],
                  "custom_value_dimensions": [
                    {
                      "key": "cvd_1",
                      "value": 1.1
                    },
                    {
                      "key": "cvd_2",
                      "value": 2.1
                    }
                  ],
                  "custom_event_dimensions": [
                    {
                      "key": "ced_1",
                      "value": 1614367426004
                    },
                    {
                      "key": "ced_2",
                      "value": 1614367426005
                    }
                  ],
                  "account_id": "account_ex_id_0",
                  "user_id": "user_ex_id_0",
                  "first_name": "Bob",
                  "last_name": "Dole",
                  "phone": "+1 111 111 1111",
                  "email": "bob@rei.com",
                  "salutation": "mr"
                },
                {
                  "account_id": "account_ex_id_2",
                  "user_id": "user_ex_id_2"
                },
                {
                  "account_id": "account_ex_id_4",
                  "user_id": "user_ex_id_4"
                }
              ]
            })
            .reply(200, {
              "status_is_ok": true,
              "failed_results": [
                {
                  "message": "Missing/invalid required field(s)'",
                  "account_id": "account_ex_id_2",
                  "user_id": "user_ex_id_2",
                  "record": 1
                }
              ]
            });

          return scope;
        },
        messages: [
          {
            user: {
              "external_id": "user_ex_id_0",
              "email": "bob@rei.com",
              "first_name": "Bob",
              "last_name": "Dole",
              "is_primary": true,
              "phone": "+1 111 111 1111",
              "salutation": "mr",

              // Custom Label Dimensions
              "source_cld_1": "cld_1_value",
              "source_cld_2": "cld_2_value",
              "source_cld_3": "cld_3_value",

              // Custom Value Dimensions
              "source_cvd_1": 1.1,
              "source_cvd_2": 2.1,
              "source_cvd_3": 3.1,

              // Custom Event Dimensions
              "source_ced_1": 1614367426004,
              "source_ced_2": 1614367426005,
              "source_ced_3": 1614367426015
            },
            account: {
              external_id: "account_ex_id_0"
            },
            segments: [
              { id: "segment_1", name: "Segment 1" }
            ],
            changes: {
              segments: {
                entered: [
                  { id: "segment_1", name: "Segment 1" }
                ]
              }
            },
            events: []
          },
          {
            account: {
              "external_id": "account_ex_id_1"
            },
            user: {
              external_id: "user_ex_id_1"
            },
            segments: [
              { id: "segment_1", name: "Segment 1" }
            ],
            changes: {
              segments: {
                entered: [
                  { id: "segment_1", name: "Segment 1" }
                ]
              }
            },
            events: []
          },
          {
            account: {
              "external_id": "account_ex_id_2"
            },
            user: {
              external_id: "user_ex_id_2"
            },
            segments: [
              { id: "segment_1", name: "Segment 1" }
            ],
            changes: {
              segments: {
                entered: [
                  { id: "segment_1", name: "Segment 1" }
                ]
              }
            },
            events: []
          },
          {
            account: {
              "external_id": "account_ex_id_3"
            },
            user: {
              external_id: "user_ex_id_3"
            },
            segments: [
              { id: "segment_1", name: "Segment 1" }
            ],
            changes: {
              segments: {
                entered: [
                  { id: "segment_1", name: "Segment 1" }
                ]
              }
            },
            events: []
          },
          {
            account: {
              "external_id": "account_ex_id_4"
            },
            user: {
              external_id: "user_ex_id_4"
            },
            segments: [
              { id: "segment_1", name: "Segment 1" }
            ],
            changes: {
              segments: {
                entered: [
                  { id: "segment_1", name: "Segment 1" }
                ]
              }
            },
            events: []
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          [
            "info",
            "outgoing.job.start",
            {
              "request_id": expect.whatever()
            },
            {
              "jobName": "Outgoing Data",
              "type": "user"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/account_contacts",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "info",
            "outgoing.user.error",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_external_id": "user_ex_id_1"
            },
            {
              "reason": "Account not found"
            }
          ],
          [
            "info",
            "outgoing.user.error",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_external_id": "user_ex_id_3"
            },
            {
              "reason": "Account not found"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/account_contacts",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_external_id": "user_ex_id_0"
            },
            {
              "data": {
                "custom_label_dimensions": [
                  {
                    "key": "cld_1",
                    "value": "cld_1_value"
                  },
                  {
                    "key": "cld_2",
                    "value": "cld_2_value"
                  }
                ],
                "custom_value_dimensions": [
                  {
                    "key": "cvd_1",
                    "value": 1.1
                  },
                  {
                    "key": "cvd_2",
                    "value": 2.1
                  }
                ],
                "custom_event_dimensions": [
                  {
                    "key": "ced_1",
                    "value": 1614367426004
                  },
                  {
                    "key": "ced_2",
                    "value": 1614367426005
                  }
                ],
                "account_id": "account_ex_id_0",
                "user_id": "user_ex_id_0",
                "first_name": "Bob",
                "last_name": "Dole",
                "phone": "+1 111 111 1111",
                "email": "bob@rei.com",
                "salutation": "mr"
              }
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_external_id": "user_ex_id_4"
            },
            {
              "data": {
                "account_id": "account_ex_id_4",
                "user_id": "user_ex_id_4"
              }
            }
          ],
          [
            "info",
            "outgoing.user.error",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_external_id": "user_ex_id_2"
            },
            {
              "reason": "Missing/invalid required field(s)'"
            }
          ],
          [
            "info",
            "outgoing.job.success",
            {
              "request_id": expect.whatever()
            },
            {
              "jobName": "Outgoing Data",
              "type": "user"
            }
          ]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });
});

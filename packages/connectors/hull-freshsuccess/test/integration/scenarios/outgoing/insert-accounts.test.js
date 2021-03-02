// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Upsert Account Tests", () => {

  it("should upsert an account", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "account:update",
        connector: {
          private_settings: {
            webhook_id: "1",
            tag_companies: true,
            api_key: "abc",
            api_host: "api-us.freshsuccess.com",
            synchronized_account_segments: ["account_segment_1"],
            outgoing_account_attributes: [
              {
                "hull": "external_id",
                "service": "account_id"
              },
              {
                "hull": "name",
                "service": "name"
              },
              {
                "hull": "source_join_date",
                "service": "join_date"
              },
              {
                "hull": "source_renewal_date",
                "service": "renewal_date"
              },
              {
                "hull": "source_billing_account_id",
                "service": "billing_account_id"
              },
              {
                "hull": "source_support_account_id",
                "service": "support_account_id"
              },
              {
                "hull": "source_crm_account_id",
                "service": "crm_account_id"
              },
              {
                "hull": "source_billing_street",
                "service": "billing_street"
              },
              {
                "hull": "source_billing_city",
                "service": "billing_city"
              },
              {
                "hull": "source_billing_postal_code",
                "service": "billing_postal_code"
              },
              {
                "hull": "source_billing_state",
                "service": "billing_state"
              },
              {
                "hull": "source_billing_country",
                "service": "billing_country"
              },
              {
                "hull": "source_phone",
                "service": "phone"
              },
              {
                "hull": "source_employees",
                "service": "employees"
              },
              {
                "hull": "source_industry",
                "service": "industry"
              },
              {
                "hull": "source_tier",
                "service": "tier"
              },
              {
                "hull": "source_csm_score",
                "service": "csm_score"
              },
              {
                "hull": "source_current_nps_score",
                "service": "current_nps_score"
              },
              {
                "hull": "source_current_mrr",
                "service": "current_mrr"
              },
              {
                "hull": "source_sales_rep_name",
                "service": "sales_rep_name"
              },
              {
                "hull": "source_sales_rep_email",
                "service": "sales_rep_email"
              },
              {
                "hull": "source_source",
                "service": "source"
              },
              {
                "hull": "source_current_stage",
                "service": "current_stage"
              },
              {
                "hull": "source_website",
                "service": "website"
              },
              {
                "hull": "source_description",
                "service": "description"
              },
              {
                "hull": "source_is_deleted",
                "service": "is_deleted"
              },
              {
                "hull": "source_is_churned",
                "service": "is_churned"
              },
              {
                "hull": "source_inactive_time",
                "service": "inactive_time"
              },
              {
                "hull": "source_inactive_reason",
                "service": "inactive_reason"
              },
              {
                "hull": "source_state",
                "service": "state"
              },
              {
                "hull": "source_parent_account_id",
                "service": "parent_account_id"
              },
              {
                "hull": "source_hierarchy_label",
                "service": "hierarchy_label"
              },
              {
                "hull": "source_latest_status_title",
                "service": "latest_status_title"
              },
              {
                "hull": "source_latest_status_details",
                "service": "latest_status_details"
              },
              {
                "hull": "source_latest_status_date",
                "service": "latest_status_date"
              },

              // ARRAY HANDLING - accept array of { email: ... } or build it
              {
                "hull": "source_assigned_csms",
                "service": "assigned_csms"
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
              },

              // ARRAY HANDLING RAW - concatenate raw object to array
              {
                "hull": "source_doc_1",
                "service": "documents"
              },
              {
                "hull": "source_doc_2",
                "service": "documents"
              },
              {
                "hull": "source_stage_1",
                "service": "stage_history"
              },
              {
                "hull": "source_stage_2",
                "service": "stage_history"
              },
              {
                "hull": "source_nps_history_1",
                "service": "nps_history"
              },
              {
                "hull": "source_nps_history_2",
                "service": "nps_history"
              }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [ { id: "account_segment_1", name: "Segment 1" }],
        externalApiMock: () => {
          const scope = nock("https://api-us.freshsuccess.com/api/v2");

          scope
            .post("/accounts", { records: [
                {
                  "account_id": "rei_1",
                  "name": "REI",
                  "join_date": 1598907978483,
                  "renewal_date": 1614367426001,
                  "billing_account_id": "bai",
                  "support_account_id": "sai",
                  "crm_account_id": "cai",
                  "billing_street": "bstreet",
                  "billing_city": "bc",
                  "billing_postal_code": "bpc",
                  "billing_state": "bstate",
                  "billing_country": "bcountry",
                  "phone": "+1 111 111 1111",
                  "employees": 100,
                  "industry": "rec",
                  "tier": "high",
                  "csm_score": 100,
                  "current_nps_score": 90,
                  "current_mrr": 1,
                  "sales_rep_name": "bob",
                  "sales_rep_email": "bob@rei.com",
                  "source": "a_source",
                  "current_stage": "c_stage",
                  "website": "rei.com",
                  "description": "rec",
                  "is_deleted": false,
                  "is_churned": false,
                  "inactive_time": 1614367426002,
                  "inactive_reason": "no reason",
                  "state": "active",
                  "parent_account_id": "pai",
                  "hierarchy_label": "hl",
                  "latest_status_title": "s_title",
                  "latest_status_details": "s_details",
                  "latest_status_date": 1614367426003,

                  "assigned_csms": [
                    { email: "csm1@rei.com" },
                    { email: "csm2@rei.com" }
                  ],

                  // Custom Label Dimensions
                  "custom_label_dimensions": [
                    { key: "cld_1", value: "cld_1_value" },
                    { key: "cld_2", value: "cld_2_value" }
                  ],

                  // Custom Value Dimensions
                  "custom_value_dimensions": [
                    { key: "cvd_1", value: 1.1 },
                    { key: "cvd_2", value: 2.1 }
                  ],

                  // Custom Event Dimensions
                  "custom_event_dimensions": [
                    { key: "ced_1", value: 1614367426004 },
                    { key: "ced_2", value: 1614367426005 }
                  ],

                  // Documents
                  documents: [
                    { name: "doc1", url: "doc1.com", description: "some description 1"},
                    { name: "doc2", url: "doc2.com", description: "some description 2"}
                  ],

                  // Stage History
                  stage_history: [
                    { name: "stage1", start_date: 1614367426006, end_date: 1614367426007 },
                    { name: "stage2", start_date: 1614367426008, end_date: 1614367426009 }
                  ],

                  // NPS History
                  nps_history: [
                    { nps_score: 1934234, date: 1614367426006, username: "bob_1", survey_name: "s_name_1", comments: "none" },
                    { nps_score: 1934234, date: 1614367426006, username: "bob_2", survey_name: "s_name_2", comments: "none" }
                  ]
                },
                {
                  "account_id": "rei_2",
                  "name": "REI2",
                },
                {
                  "account_id": "rei_3",
                  "name": "REI3",
                  "join_date": "string",
                },
                {
                  "account_id": "rei_4",
                  "name": "REI4",
                  "join_date": "string",
                }
              ]})
            .reply(200, {
              "status_is_ok": false,
              "failed_results": [
                {
                  "message": "Invalid type for property: join_date (expecting timestamp)",
                  "account_id": "rei_3",
                  "record": 2
                },
                {
                  "message": "Invalid type for property: join_date (expecting timestamp)",
                  "account_id": "rei_4",
                  "record": 3
                }
              ]
            });

          scope
            .post("/accounts", { records: [
              {
                "account_id": "rei_1",
                "name": "REI",
                "join_date": 1598907978483,
                "renewal_date": 1614367426001,
                "billing_account_id": "bai",
                "support_account_id": "sai",
                "crm_account_id": "cai",
                "billing_street": "bstreet",
                "billing_city": "bc",
                "billing_postal_code": "bpc",
                "billing_state": "bstate",
                "billing_country": "bcountry",
                "phone": "+1 111 111 1111",
                "employees": 100,
                "industry": "rec",
                "tier": "high",
                "csm_score": 100,
                "current_nps_score": 90,
                "current_mrr": 1,
                "sales_rep_name": "bob",
                "sales_rep_email": "bob@rei.com",
                "source": "a_source",
                "current_stage": "c_stage",
                "website": "rei.com",
                "description": "rec",
                "is_deleted": false,
                "is_churned": false,
                "inactive_time": 1614367426002,
                "inactive_reason": "no reason",
                "state": "active",
                "parent_account_id": "pai",
                "hierarchy_label": "hl",
                "latest_status_title": "s_title",
                "latest_status_details": "s_details",
                "latest_status_date": 1614367426003,

                "assigned_csms": [
                  { email: "csm1@rei.com" },
                  { email: "csm2@rei.com" }
                ],

                // Custom Label Dimensions
                "custom_label_dimensions": [
                  { key: "cld_1", value: "cld_1_value" },
                  { key: "cld_2", value: "cld_2_value" }
                ],

                // Custom Value Dimensions
                "custom_value_dimensions": [
                  { key: "cvd_1", value: 1.1 },
                  { key: "cvd_2", value: 2.1 }
                ],

                // Custom Event Dimensions
                "custom_event_dimensions": [
                  { key: "ced_1", value: 1614367426004 },
                  { key: "ced_2", value: 1614367426005 }
                ],

                // Documents
                documents: [
                  { name: "doc1", url: "doc1.com", description: "some description 1"},
                  { name: "doc2", url: "doc2.com", description: "some description 2"}
                ],

                // Stage History
                stage_history: [
                  { name: "stage1", start_date: 1614367426006, end_date: 1614367426007 },
                  { name: "stage2", start_date: 1614367426008, end_date: 1614367426009 }
                ],

                // NPS History
                nps_history: [
                  { nps_score: 1934234, date: 1614367426006, username: "bob_1", survey_name: "s_name_1", comments: "none" },
                  { nps_score: 1934234, date: 1614367426006, username: "bob_2", survey_name: "s_name_2", comments: "none" }
                ]
              },
              {
                "account_id": "rei_2",
                "name": "REI2",
              },
            ]})
            .reply(200, {
              "status_is_ok": true,
              "failed_results": [
                {
                  "message": "Missing/invalid required field(s) for Accounts insert: 'join_date'",
                  "account_id": "rei_2",
                  "record": 1
                }
              ]
            });

          return scope;
        },
        messages: [
          {
            account: {
              "external_id": "rei_1",
              "name": "REI",
              "source_join_date": "2020-08-31T21:06:18.483Z",
              "source_renewal_date": 1614367426001,
              "source_billing_account_id": "bai",
              "source_support_account_id": "sai",
              "source_crm_account_id": "cai",
              "source_billing_street": "bstreet",
              "source_billing_city": "bc",
              "source_billing_postal_code": "bpc",
              "source_billing_state": "bstate",
              "source_billing_country": "bcountry",
              "source_phone": "+1 111 111 1111",
              "source_employees": 100,
              "source_industry": "rec",
              "source_tier": "high",
              "source_csm_score": 100,
              "source_current_nps_score": 90,
              "source_current_mrr": 1,
              "source_sales_rep_name": "bob",
              "source_sales_rep_email": "bob@rei.com",
              "source_source": "a_source",
              "source_current_stage": "c_stage",
              "source_website": "rei.com",
              "source_description": "rec",
              "source_is_deleted": false,
              "source_is_churned": false,
              "source_inactive_time": 1614367426002,
              "source_inactive_reason": "no reason",
              "source_state": "active",
              "source_parent_account_id": "pai",
              "source_hierarchy_label": "hl",
              "source_latest_status_title": "s_title",
              "source_latest_status_details": "s_details",
              "source_latest_status_date": 1614367426003,

              // All Below Require Special Array Handling
              "source_assigned_csms": ["csm1@rei.com", "csm2@rei.com"],

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
              "source_ced_3": 1614367426015,

              // Documents
              "source_doc_1": { name: "doc1", url: "doc1.com", description: "some description 1"},
              "source_doc_2": { name: "doc2", url: "doc2.com", description: "some description 2"},

              // Stage History
              "source_stage_1": { name: "stage1", start_date: 1614367426006, end_date: 1614367426007 },
              "source_stage_2": { name: "stage2", start_date: 1614367426008, end_date: 1614367426009 },

              // NPS History
              "source_nps_history_1": { nps_score: 1934234, date: 1614367426006, username: "bob_1", survey_name: "s_name_1", comments: "none" },
              "source_nps_history_2": { nps_score: 1934234, date: 1614367426006, username: "bob_2", survey_name: "s_name_2", comments: "none" }

            },
            user: {},
            account_segments: [
              { id: "account_segment_1", name: "Account Segment 1" }
            ],
            changes: {
              account_segments: {
                entered: [
                  { id: "account_segment_1", name: "Account Segment 1" }
                ]
              }
            },
            events: []
          },
          {
            account: {
              "external_id": "rei_2",
              "name": "REI2",
            },
            user: {},
            account_segments: [
              { id: "account_segment_1", name: "Account Segment 1" }
            ],
            changes: {
              account_segments: {
                entered: [
                  { id: "account_segment_1", name: "Account Segment 1" }
                ]
              }
            },
            events: []
          },
          {
            account: {
              "external_id": "rei_3",
              "name": "REI3",
              "source_join_date": "string"
            },
            user: {},
            account_segments: [
              { id: "account_segment_1", name: "Account Segment 1" }
            ],
            changes: {
              account_segments: {
                entered: [
                  { id: "account_segment_1", name: "Account Segment 1" }
                ]
              }
            },
            events: []
          },
          {
            account: {
              "external_id": "rei_4",
              "name": "REI4",
              "source_join_date": "string"
            },
            user: {},
            account_segments: [
              { id: "account_segment_1", name: "Account Segment 1" }
            ],
            changes: {
              account_segments: {
                entered: [
                  { id: "account_segment_1", name: "Account Segment 1" }
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
              "type": "account"
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
              "url": "/accounts",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "info",
            "outgoing.account.error",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_external_id": "rei_3"
            },
            {
              "reason": "Invalid type for property: join_date (expecting timestamp)"
            }
          ],
          [
            "info",
            "outgoing.account.error",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_external_id": "rei_4"
            },
            {
              "reason": "Invalid type for property: join_date (expecting timestamp)"
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
              "url": "/accounts",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_external_id": "rei_1"
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
                "account_id": "rei_1",
                "name": "REI",
                "join_date": 1598907978483,
                "renewal_date": 1614367426001,
                "billing_account_id": "bai",
                "support_account_id": "sai",
                "crm_account_id": "cai",
                "billing_street": "bstreet",
                "billing_city": "bc",
                "billing_postal_code": "bpc",
                "billing_state": "bstate",
                "billing_country": "bcountry",
                "phone": "+1 111 111 1111",
                "employees": 100,
                "industry": "rec",
                "tier": "high",
                "csm_score": 100,
                "current_nps_score": 90,
                "current_mrr": 1,
                "sales_rep_name": "bob",
                "sales_rep_email": "bob@rei.com",
                "source": "a_source",
                "current_stage": "c_stage",
                "website": "rei.com",
                "description": "rec",
                "is_deleted": false,
                "is_churned": false,
                "inactive_time": 1614367426002,
                "inactive_reason": "no reason",
                "state": "active",
                "parent_account_id": "pai",
                "hierarchy_label": "hl",
                "latest_status_title": "s_title",
                "latest_status_details": "s_details",
                "latest_status_date": 1614367426003,
                "assigned_csms": [
                  {
                    "email": "csm1@rei.com"
                  },
                  {
                    "email": "csm2@rei.com"
                  }
                ],
                "documents": [
                  {
                    "name": "doc1",
                    "url": "doc1.com",
                    "description": "some description 1"
                  },
                  {
                    "name": "doc2",
                    "url": "doc2.com",
                    "description": "some description 2"
                  }
                ],
                "stage_history": [
                  {
                    "name": "stage1",
                    "start_date": 1614367426006,
                    "end_date": 1614367426007
                  },
                  {
                    "name": "stage2",
                    "start_date": 1614367426008,
                    "end_date": 1614367426009
                  }
                ],
                "nps_history": [
                  {
                    "nps_score": 1934234,
                    "date": 1614367426006,
                    "username": "bob_1",
                    "survey_name": "s_name_1",
                    "comments": "none"
                  },
                  {
                    "nps_score": 1934234,
                    "date": 1614367426006,
                    "username": "bob_2",
                    "survey_name": "s_name_2",
                    "comments": "none"
                  }
                ]
              }
            }
          ],
          [
            "info",
            "outgoing.account.error",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_external_id": "rei_2"
            },
            {
              "reason": "Missing/invalid required field(s) for Accounts insert: 'join_date'"
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
              "type": "account"
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

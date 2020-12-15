module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
      "deletePersonWebhookId": 145472,
      "flow_control_user_update_success_size": "100",
      "outgoing_user_attributes": [
        {
          "hull": "test/city",
          "service": "addressCity",
          "overwrite": true
        },
        {
          "hull": "test/customersourcename",
          "service": "customerSource",
          "overwrite": true
        },
        {
          "hull": "test/somecheckbox",
          "service": "Some Checkbox",
          "overwrite": true
        },
        {
          "hull": "test/somecurrency",
          "service": "Some Currency",
          "overwrite": true
        },
        {
          "hull": "test/somedate",
          "service": "Some Date",
          "overwrite": true
        },
        {
          "hull": "test/somedropdown",
          "service": "Some Dropdown",
          "overwrite": true
        },
        {
          "hull": "test/somemultiselect",
          "service": "Some Multi Select Dropdown",
          "overwrite": true
        },
        {
          "hull": "test/somenumberfield",
          "service": "Some Number Field",
          "overwrite": true
        },
        {
          "hull": "test/somepercentage",
          "service": "Some Percentage",
          "overwrite": true
        },
        {
          "hull": "test/sometextarea",
          "service": "Some Text Area",
          "overwrite": true
        },
        {
          "hull": "test/sometextfield",
          "service": "Some Text Field",
          "overwrite": true
        },
        {
          "hull": "test/someurl",
          "service": "Some Url",
          "overwrite": true
        },
        {
          "hull": "email",
          "service": "name",
          "overwrite": true
        },
        {
          "hull": "email",
          "service": "primaryEmail",
          "overwrite": true
        }
      ],
      "coppercrm_api_key": "shhh",
      "lead_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "coppercrm_email": "tim@hull.io",
      "user_claims": [
        {
          "service": "primaryEmail",
          "hull": "email"
        }
      ],
      "last_fetchRecentPeople": 1608068237,
      "synchronized_user_segments": [
        "5fce381f0fe58ea4e5cb840c"
      ],
      "flow_control_account_update_success_size": "100",
      "outgoing_lead_attributes": [
        {
          "service": "addressCity",
          "overwrite": true,
          "hull": "test/city"
        },
        {
          "service": "customerSource",
          "overwrite": true,
          "hull": "test/customersourcename"
        },
        {
          "service": "Some Checkbox",
          "overwrite": true,
          "hull": "test/somecheckbox"
        },
        {
          "service": "Some Currency",
          "overwrite": true,
          "hull": "test/somecurrency"
        },
        {
          "service": "Some Date",
          "overwrite": true,
          "hull": "test/somedate"
        },
        {
          "service": "Some Dropdown",
          "overwrite": true,
          "hull": "test/somedropdown"
        },
        {
          "service": "Some Multi Select Dropdown",
          "overwrite": true,
          "hull": "test/somemultiselect"
        },
        {
          "service": "Some Number Field",
          "overwrite": true,
          "hull": "test/somenumberfield"
        },
        {
          "service": "Some Percentage",
          "overwrite": true,
          "hull": "test/somepercentage"
        },
        {
          "service": "Some Text Area",
          "overwrite": true,
          "hull": "test/sometextarea"
        },
        {
          "service": "Some Text Field",
          "overwrite": true,
          "hull": "test/sometextfield"
        },
        {
          "service": "Some Url",
          "overwrite": true,
          "hull": "test/someurl"
        },
        {
          "hull": "email",
          "service": "name",
          "overwrite": true
        },
        {
          "hull": "email",
          "service": "primaryEmail",
          "overwrite": true
        }
      ],
      "ignore_deleted_accounts": true,
      "ignore_deleted_users": true,
      "deleteOpportunityWebhookId": 145474,
      "last_fetchRecentLeads": 1608063739,
      "account_claims": [
        {
          "hull": "domain",
          "service": "email_domain"
        }
      ],
      "person_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "deleteCompanyWebhookId": 145473,
      "deleteLeadWebhookId": 145471,
      "link_person_in_hull": false,
      "synchronized_lead_segments": [],
      "activities_to_fetch": [],
      "events_mapping": []
    }
  },
  "route": "userUpdate",
  "input": {
    "data": [
      {
        "notification-timestamp": 1608068372,
        "user": {
          "test/somenumberfield": 789,
          "test/somecurrency": "55.5",
          "test/somemultiselect": [
            "Some Multi Select Option 4",
            "Some Multi Select Option 1",
            "asdf",
            "Bad"
          ],
          "test/customersourcename": "linkedincampaign",
          "coppercrm_lead/id": 62195324,
          "id": "5fce417066d66db3c55306f4",
          "email": "someleadabc@hull.io",
          "name": "somelead2@hull.io",
          "test/city": "New Haven",
          "anonymous_ids": [
            "coppercrm-lead:lead-62195324"
          ],
          "domain": "hull.io",
          "test/someurl": "https://www.linkedin.com",
          "indexed_at": "2020-12-15T21:39:32.463Z",
          "test/sometextarea": "alot of text",
          "first_name": "somelead2@hull.io",
          "test/somedate": "12/15/2020",
          "created_at": "2020-12-07T14:51:28.143Z",
          "test/somecheckbox": true,
          "test/somedropdown": "Some Option 1",
          "test/somepercentage": 0.34,
          "test/sometextfield": "sometextfieldvalue",
          "segment_ids": [
            "5fce381f0fe58ea4e5cb840c"
          ]
        },
        "uuid": "7e1fcf52-211f-4fd9-9a47-79610353cc53",
        "org-id": "5bc5e51ce8677b5ddb0072f7",
        "changes": {
          "is_new": false,
          "user": {
            "test/city": [
              "Warwick",
              "New Haven"
            ]
          },
          "account": {},
          "segments": {},
          "account_segments": {}
        },
        "account": {},
        "segments": [
          {
            "id": "5fce381f0fe58ea4e5cb840c",
            "name": "Copper custom attributes test",
            "updated_at": "2020-12-07T14:51:09.615Z",
            "type": "users_segment",
            "created_at": "2020-12-07T14:11:43.102Z"
          }
        ],
        "events": [],
        "account_segments": [],
        "update_id": "organization.hullapp.io:std:128762",
        "message_id": "81f6246028e15d134b0879bade1bf3fd1b238ef5",
        "user_segments": [
          {
            "id": "5fce381f0fe58ea4e5cb840c",
            "name": "Copper custom attributes test",
            "updated_at": "2020-12-07T14:51:09.615Z",
            "type": "users_segment",
            "created_at": "2020-12-07T14:11:43.102Z"
          }
        ]
      }
    ],
    "classType": {
      "service_name": "HullOutgoingUser",
      "name": "User"
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "batchFindPerson",
      "input": {
        "page_size": 25,
        "sort_by": "name",
        "emails": [
          "someleadabc@hull.io"
        ]
      },
      "result": {
        "status": 200,
        "text": "[]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getCustomerSources",
      "result": {
        "status": 200,
        "text": "[{\"id\":1235215,\"name\":\"linkedincampaign\"},{\"id\":1227913,\"name\":\"Advertising\"},{\"id\":1227912,\"name\":\"Cold Call\"},{\"id\":1227911,\"name\":\"Email\"}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getCustomFields",
      "result": {
        "status": 200,
        "text": "[{\"id\":455893,\"name\":\"Some Checkbox\",\"data_type\":\"Checkbox\",\"available_on\":[\"lead\",\"person\"]},{\"id\":455894,\"name\":\"Some Currency\",\"data_type\":\"Currency\",\"available_on\":[\"person\",\"lead\"],\"currency\":\"USD\"},{\"id\":455895,\"name\":\"Some Date\",\"data_type\":\"Date\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455896,\"name\":\"Some Dropdown\",\"data_type\":\"Dropdown\",\"available_on\":[\"person\",\"lead\"],\"options\":[{\"id\":1532570,\"name\":\"Some Option 3\",\"rank\":2},{\"id\":1532569,\"name\":\"Some Option 2\",\"rank\":1},{\"id\":1532568,\"name\":\"Some Option 1\",\"rank\":0}]},{\"id\":455897,\"name\":\"Some Multi Select Dropdown\",\"data_type\":\"MultiSelect\",\"available_on\":[\"person\",\"lead\"],\"options\":[{\"id\":1532722,\"name\":\"Some Multi Select Option 4\",\"rank\":7},{\"id\":1532721,\"name\":\"Some Multi Select Option 3\",\"rank\":6},{\"id\":1532720,\"name\":\"Some Multi Select Option 2\",\"rank\":5},{\"id\":1532719,\"name\":\"Some Multi Select Option 1\",\"rank\":4},{\"id\":1532574,\"name\":\"Some Multi Select Dropdown 4\",\"rank\":3},{\"id\":1532573,\"name\":\"Some Multi Select Dropdown 3\",\"rank\":2},{\"id\":1532572,\"name\":\"Some Multi Select Dropdown 2\",\"rank\":1},{\"id\":1532571,\"name\":\"Some Multi Select Dropdown 1\",\"rank\":0}]},{\"id\":455899,\"name\":\"Some Number Field\",\"data_type\":\"Float\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455900,\"name\":\"Some Percentage\",\"data_type\":\"Percentage\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455901,\"name\":\"Some Text Area\",\"data_type\":\"Text\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455902,\"name\":\"Some Text Field\",\"data_type\":\"String\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455903,\"name\":\"Some Url\",\"data_type\":\"URL\",\"available_on\":[\"person\",\"lead\"]}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getCustomFields",
      "result": {
        "status": 200,
        "text": "[{\"id\":455893,\"name\":\"Some Checkbox\",\"data_type\":\"Checkbox\",\"available_on\":[\"lead\",\"person\"]},{\"id\":455894,\"name\":\"Some Currency\",\"data_type\":\"Currency\",\"available_on\":[\"person\",\"lead\"],\"currency\":\"USD\"},{\"id\":455895,\"name\":\"Some Date\",\"data_type\":\"Date\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455896,\"name\":\"Some Dropdown\",\"data_type\":\"Dropdown\",\"available_on\":[\"person\",\"lead\"],\"options\":[{\"id\":1532570,\"name\":\"Some Option 3\",\"rank\":2},{\"id\":1532569,\"name\":\"Some Option 2\",\"rank\":1},{\"id\":1532568,\"name\":\"Some Option 1\",\"rank\":0}]},{\"id\":455897,\"name\":\"Some Multi Select Dropdown\",\"data_type\":\"MultiSelect\",\"available_on\":[\"person\",\"lead\"],\"options\":[{\"id\":1532722,\"name\":\"Some Multi Select Option 4\",\"rank\":7},{\"id\":1532721,\"name\":\"Some Multi Select Option 3\",\"rank\":6},{\"id\":1532720,\"name\":\"Some Multi Select Option 2\",\"rank\":5},{\"id\":1532719,\"name\":\"Some Multi Select Option 1\",\"rank\":4},{\"id\":1532574,\"name\":\"Some Multi Select Dropdown 4\",\"rank\":3},{\"id\":1532573,\"name\":\"Some Multi Select Dropdown 3\",\"rank\":2},{\"id\":1532572,\"name\":\"Some Multi Select Dropdown 2\",\"rank\":1},{\"id\":1532571,\"name\":\"Some Multi Select Dropdown 1\",\"rank\":0}]},{\"id\":455899,\"name\":\"Some Number Field\",\"data_type\":\"Float\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455900,\"name\":\"Some Percentage\",\"data_type\":\"Percentage\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455901,\"name\":\"Some Text Area\",\"data_type\":\"Text\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455902,\"name\":\"Some Text Field\",\"data_type\":\"String\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455903,\"name\":\"Some Url\",\"data_type\":\"URL\",\"available_on\":[\"person\",\"lead\"]}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getCustomFields",
      "result": {
        "status": 200,
        "text": "[{\"id\":455893,\"name\":\"Some Checkbox\",\"data_type\":\"Checkbox\",\"available_on\":[\"lead\",\"person\"]},{\"id\":455894,\"name\":\"Some Currency\",\"data_type\":\"Currency\",\"available_on\":[\"person\",\"lead\"],\"currency\":\"USD\"},{\"id\":455895,\"name\":\"Some Date\",\"data_type\":\"Date\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455896,\"name\":\"Some Dropdown\",\"data_type\":\"Dropdown\",\"available_on\":[\"person\",\"lead\"],\"options\":[{\"id\":1532570,\"name\":\"Some Option 3\",\"rank\":2},{\"id\":1532569,\"name\":\"Some Option 2\",\"rank\":1},{\"id\":1532568,\"name\":\"Some Option 1\",\"rank\":0}]},{\"id\":455897,\"name\":\"Some Multi Select Dropdown\",\"data_type\":\"MultiSelect\",\"available_on\":[\"person\",\"lead\"],\"options\":[{\"id\":1532722,\"name\":\"Some Multi Select Option 4\",\"rank\":7},{\"id\":1532721,\"name\":\"Some Multi Select Option 3\",\"rank\":6},{\"id\":1532720,\"name\":\"Some Multi Select Option 2\",\"rank\":5},{\"id\":1532719,\"name\":\"Some Multi Select Option 1\",\"rank\":4},{\"id\":1532574,\"name\":\"Some Multi Select Dropdown 4\",\"rank\":3},{\"id\":1532573,\"name\":\"Some Multi Select Dropdown 3\",\"rank\":2},{\"id\":1532572,\"name\":\"Some Multi Select Dropdown 2\",\"rank\":1},{\"id\":1532571,\"name\":\"Some Multi Select Dropdown 1\",\"rank\":0}]},{\"id\":455899,\"name\":\"Some Number Field\",\"data_type\":\"Float\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455900,\"name\":\"Some Percentage\",\"data_type\":\"Percentage\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455901,\"name\":\"Some Text Area\",\"data_type\":\"Text\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455902,\"name\":\"Some Text Field\",\"data_type\":\"String\",\"available_on\":[\"person\",\"lead\"]},{\"id\":455903,\"name\":\"Some Url\",\"data_type\":\"URL\",\"available_on\":[\"person\",\"lead\"]}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "insertPerson",
      "input": {
        "name": "someleadabc@hull.io",
        "address": {
          "city": "New Haven"
        },
        "emails": [
          {
            "email": "someleadabc@hull.io",
            "category": "other"
          }
        ],
        "customer_source_id": 1235215,
        "custom_fields": [
          {
            "custom_field_definition_id": 455893,
            "value": true
          },
          {
            "custom_field_definition_id": 455894,
            "value": "55.5"
          },
          {
            "custom_field_definition_id": 455895,
            "value": "12/15/2020"
          },
          {
            "custom_field_definition_id": 455896,
            "value": 1532568
          },
          {
            "custom_field_definition_id": 455897,
            "value": [
              1532722,
              1532719
            ]
          },
          {
            "custom_field_definition_id": 455899,
            "value": 789
          },
          {
            "custom_field_definition_id": 455900,
            "value": 0.34
          },
          {
            "custom_field_definition_id": 455901,
            "value": "alot of text"
          },
          {
            "custom_field_definition_id": 455902,
            "value": "sometextfieldvalue"
          },
          {
            "custom_field_definition_id": 455903,
            "value": "https://www.linkedin.com"
          }
        ]
      },
      "result": {
        "status": 200,
        "text": "{\"id\":113446780,\"name\":\"someleadabc@hull.io\",\"prefix\":null,\"first_name\":\"someleadabc@hull.io\",\"middle_name\":null,\"last_name\":null,\"suffix\":null,\"address\":{\"street\":null,\"city\":\"New Haven\",\"state\":null,\"postal_code\":null,\"country\":null},\"assignee_id\":null,\"company_id\":null,\"company_name\":null,\"contact_type_id\":1655328,\"details\":null,\"emails\":[{\"email\":\"someleadabc@hull.io\",\"category\":\"other\"}],\"phone_numbers\":[],\"socials\":[],\"tags\":[],\"title\":null,\"websites\":[],\"custom_fields\":[{\"custom_field_definition_id\":455893,\"value\":true},{\"custom_field_definition_id\":455894,\"value\":55.5},{\"custom_field_definition_id\":455895,\"value\":1608019200},{\"custom_field_definition_id\":455896,\"value\":1532568},{\"custom_field_definition_id\":455897,\"value\":[1532719,1532722]},{\"custom_field_definition_id\":455899,\"value\":789.0},{\"custom_field_definition_id\":455900,\"value\":0},{\"custom_field_definition_id\":455901,\"value\":\"alot of text\"},{\"custom_field_definition_id\":455902,\"value\":\"sometextfieldvalue\"},{\"custom_field_definition_id\":455903,\"value\":\"https://www.linkedin.com\"}],\"date_created\":1608068799,\"date_modified\":1608068799,\"date_last_contacted\":null,\"interaction_count\":0,\"leads_converted_from\":[],\"date_lead_created\":null}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "someleadabc@hull.io",
          "anonymous_id": "coppercrm-person:person-113446780",
          "anonymous_ids": []
        },
        "attributes": {
          "coppercrm_person/id": {
            "value": 113446780,
            "operation": "set"
          },
          "name": {
            "operation": "setIfNull",
            "value": "someleadabc@hull.io"
          }
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}

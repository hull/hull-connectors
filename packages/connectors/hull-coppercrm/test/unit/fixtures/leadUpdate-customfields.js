module.exports = {
  "configuration": {
  "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
    "deletePersonWebhookId": 145472,
      "flow_control_user_update_success_size": "100",
      "coppercrm_api_key": "key",
      "lead_claims": [
      {
        "hull": "email",
        "service": "primaryEmail"
      }
    ],
      "coppercrm_email": "tim@hull.io",
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
      "activities_to_fetch": []
  }
},
  "route": "leadUpdate",
  "input": {
  "data": [
    {
      "user": {
        "test/somenumberfield": 789,
        "test/somecurrency": "55.5",
        "test/somemultiselect": [
          "Some Multi Select Option 4",
          "Some Multi Select Option 2"
        ],
        "test/customersourcename": "linkedincampaign",
        "id": "5fca8f3766d66decef13c887",
        "email": "somelead1@hull.io",
        "test/city": "San Antonio",
        "domain": "hull.io",
        "test/someurl": "https://www.linkedin.com",
        "indexed_at": "2020-12-04T19:34:15.454Z",
        "test/sometextarea": "alot of text",
        "test/somedate": "12/15/2020",
        "created_at": "2020-12-04T19:34:15.435Z",
        "test/somecheckbox": true,
        "test/somedropdown": "Some Option 2",
        "test/somepercentage": 0.34,
        "test/sometextfield": "sometextfieldvalue"
      },
      "account": {},
      "segments": [],
      "message_id": "52f43d7737305475e93cb76187b50a8ba218ec68",
      "update_id": "5c092905c36af496c700012e:6:0:0",
      "user_segments": []
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
      "text": "[{\"id\":455893,\"name\":\"Some Checkbox\",\"data_type\":\"Checkbox\",\"available_on\":[\"lead\",\"person\"]},{\"id\":455894,\"name\":\"Some Currency\",\"data_type\":\"Currency\",\"available_on\":[\"lead\"],\"currency\":\"USD\"},{\"id\":455895,\"name\":\"Some Date\",\"data_type\":\"Date\",\"available_on\":[\"lead\"]},{\"id\":455896,\"name\":\"Some Dropdown\",\"data_type\":\"Dropdown\",\"available_on\":[\"lead\"],\"options\":[{\"id\":1532570,\"name\":\"Some Option 3\",\"rank\":2},{\"id\":1532569,\"name\":\"Some Option 2\",\"rank\":1},{\"id\":1532568,\"name\":\"Some Option 1\",\"rank\":0}]},{\"id\":455897,\"name\":\"Some Multi Select Dropdown\",\"data_type\":\"MultiSelect\",\"available_on\":[\"lead\"],\"options\":[{\"id\":1532722,\"name\":\"Some Multi Select Option 4\",\"rank\":7},{\"id\":1532721,\"name\":\"Some Multi Select Option 3\",\"rank\":6},{\"id\":1532720,\"name\":\"Some Multi Select Option 2\",\"rank\":5},{\"id\":1532719,\"name\":\"Some Multi Select Option 1\",\"rank\":4},{\"id\":1532574,\"name\":\"Some Multi Select Dropdown 4\",\"rank\":3},{\"id\":1532573,\"name\":\"Some Multi Select Dropdown 3\",\"rank\":2},{\"id\":1532572,\"name\":\"Some Multi Select Dropdown 2\",\"rank\":1},{\"id\":1532571,\"name\":\"Some Multi Select Dropdown 1\",\"rank\":0}]},{\"id\":455899,\"name\":\"Some Number Field\",\"data_type\":\"Float\",\"available_on\":[\"lead\"]},{\"id\":455900,\"name\":\"Some Percentage\",\"data_type\":\"Percentage\",\"available_on\":[\"lead\"]},{\"id\":455901,\"name\":\"Some Text Area\",\"data_type\":\"Text\",\"available_on\":[\"lead\"]},{\"id\":455902,\"name\":\"Some Text Field\",\"data_type\":\"String\",\"available_on\":[\"lead\"]},{\"id\":455903,\"name\":\"Some Url\",\"data_type\":\"URL\",\"available_on\":[\"lead\"]}]"
    }
  },
  {
    "localContext": expect.anything(),
    "name": "coppercrm",
    "op": "upsertLead",
    "input": {
      "properties": {
        "name": "somelead1@hull.io",
        "address": {
          "city": "San Antonio"
        },
        "email": {
          "email": "somelead1@hull.io",
          "category": "other"
        },
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
            "value": 1532569
          },
          {
            "custom_field_definition_id": 455897,
            "value": [
              1532722,
              1532720
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
      "match": {
        "field_name": "email",
        "field_value": "somelead1@hull.io"
      }
    },
    "result": {
      "status": 200,
      "text": "{\"id\":62182557,\"name\":\"somelead1@hull.io\",\"prefix\":null,\"first_name\":\"somelead1@hull.io\",\"last_name\":null,\"middle_name\":null,\"suffix\":null,\"address\":{\"street\":null,\"city\":\"San Antonio\",\"state\":null,\"postal_code\":null,\"country\":null},\"assignee_id\":null,\"company_name\":null,\"customer_source_id\":1235215,\"details\":null,\"email\":{\"email\":\"somelead1@hull.io\",\"category\":\"other\"},\"interaction_count\":0,\"monetary_unit\":null,\"monetary_value\":null,\"converted_unit\":null,\"converted_value\":null,\"socials\":[],\"status\":\"New\",\"status_id\":1299086,\"tags\":[],\"title\":null,\"websites\":[],\"phone_numbers\":[],\"custom_fields\":[{\"custom_field_definition_id\":455893,\"value\":true},{\"custom_field_definition_id\":455894,\"value\":55.5},{\"custom_field_definition_id\":455895,\"value\":1608019200},{\"custom_field_definition_id\":455896,\"value\":1532569},{\"custom_field_definition_id\":455897,\"value\":[1532720,1532722]},{\"custom_field_definition_id\":455899,\"value\":789.0},{\"custom_field_definition_id\":455900,\"value\":0},{\"custom_field_definition_id\":455901,\"value\":\"alot of text\"},{\"custom_field_definition_id\":455902,\"value\":\"sometextfieldvalue\"},{\"custom_field_definition_id\":455903,\"value\":\"https://www.linkedin.com\"}],\"date_created\":1607123827,\"date_modified\":1607123827,\"date_last_contacted\":null,\"converted_opportunity_id\":null,\"converted_contact_id\":null,\"converted_at\":null}"
    }
  },
  {
    "localContext": expect.anything(),
    "name": "hull",
    "op": "asUser",
    "input": {
      "ident": {
        "email": "somelead1@hull.io",
        "anonymous_id": "coppercrm-lead:lead-62182557"
      },
      "attributes": {
        "coppercrm_lead/id": {
          "value": 62182557,
          "operation": "set"
        },
        "name": {
          "operation": "setIfNull",
          "value": "somelead1@hull.io"
        }
      }
    },
    "result": {}
  }
],
  "result": expect.anything()
}

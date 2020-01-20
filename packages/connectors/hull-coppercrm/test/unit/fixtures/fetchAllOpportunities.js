module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
      "lead_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "person_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "link_person_in_hull": false,
      "account_claims": [
        {
          "hull": "domain",
          "service": "email_domain"
        }
      ],
      "flow_control_user_update_success_size": "100",
      "flow_control_account_update_success_size": "100",
      "activities_to_fetch": [],
      "coppercrm_api_key": "apikeyshhh",
      "coppercrm_email": "timliuhull3@gmail.com",
      "deleteLeadWebhookId": 113240,
      "deletePersonWebhookId": 113241,
      "deleteCompanyWebhookId": 113242,
      "deleteOpportunityWebhookId": 113243,
      "last_fetchRecentCompanies": 1577816042,
      "incoming_account_attributes": [],
      "last_fetchRecentOpportunities": 1577822084,
      "incoming_opportunity_type": "Opportunity Type",
      "incoming_opportunity_attributes": [
        {
          "service": "name",
          "hull": "oppname",
          "overwrite": true
        },
        {
          "service": "assignee_id",
          "hull": "assigneeid",
          "overwrite": true
        },
        {
          "service": "assigneeEmail",
          "hull": "assigneeemail",
          "overwrite": true
        },
        {
          "service": "close_date",
          "hull": "closedate_at",
          "overwrite": true
        },
        {
          "service": "company_id",
          "hull": "company_id",
          "overwrite": true
        },
        {
          "service": "company_name",
          "hull": "companyname",
          "overwrite": true
        },
        {
          "service": "customer_source_id",
          "hull": "customersourceid",
          "overwrite": true
        },
        {
          "service": "customerSource",
          "hull": "customersource",
          "overwrite": false
        },
        {
          "service": "details",
          "hull": "details",
          "overwrite": true
        },
        {
          "service": "loss_reason_id",
          "hull": "lossreasonid",
          "overwrite": true
        },
        {
          "service": "lossReason",
          "hull": "lossreasonname",
          "overwrite": true
        },
        {
          "service": "pipeline_id",
          "hull": "pipelineid",
          "overwrite": true
        },
        {
          "service": "pipeline",
          "hull": "pipelinename",
          "overwrite": true
        },
        {
          "service": "pipeline_stage_id",
          "hull": "pipelinestageid",
          "overwrite": true
        },
        {
          "service": "pipelineStage",
          "hull": "pipelinestagename",
          "overwrite": true
        },
        {
          "service": "primary_contact_id",
          "hull": "primarycontactid",
          "overwrite": true
        },
        {
          "service": "primaryContactEmail",
          "hull": "primarycontactemail",
          "overwrite": true
        },
        {
          "service": "priority",
          "hull": "priority",
          "overwrite": true
        },
        {
          "service": "status",
          "hull": "status",
          "overwrite": true
        },
        {
          "service": "tags",
          "hull": "tags",
          "overwrite": true
        },
        {
          "service": "interaction_count",
          "hull": "interactioncount",
          "overwrite": true
        },
        {
          "service": "monetary_unit",
          "hull": "monitaryunit",
          "overwrite": true
        },
        {
          "service": "monetary_value",
          "hull": "monetary_value",
          "overwrite": true
        },
        {
          "service": "converted_unit",
          "hull": "convertedunit",
          "overwrite": true
        },
        {
          "service": "converted_value",
          "hull": "convertedvalue",
          "overwrite": true
        },
        {
          "service": "win_probability",
          "hull": "winprobability",
          "overwrite": false
        },
        {
          "service": "date_stage_changed",
          "hull": "datestagechanged_at",
          "overwrite": true
        },
        {
          "service": "date_last_contacted",
          "hull": "datelastcontacted_at",
          "overwrite": true
        },
        {
          "service": "date_lead_created",
          "hull": "dateleadcreated_at",
          "overwrite": false
        },
        {
          "service": "date_created",
          "hull": "datecreated",
          "overwrite": true
        },
        {
          "service": "date_modified",
          "hull": "datemodified_at",
          "overwrite": false
        },
        {
          "service": "Checkbox",
          "hull": "checkbox",
          "overwrite": true
        },
        {
          "service": "Currency Field",
          "hull": "currencyfield",
          "overwrite": true
        },
        {
          "service": "Date Field",
          "hull": "datefield",
          "overwrite": true
        },
        {
          "service": "Dropdown Field",
          "hull": "dropdownfield",
          "overwrite": true
        },
        {
          "service": "Multi Select Dropdown Field",
          "hull": "multiselectfield",
          "overwrite": false
        },
        {
          "service": "Number Field",
          "hull": "numberfield",
          "overwrite": true
        },
        {
          "service": "Percentage Field",
          "hull": "percentagefield",
          "overwrite": true
        },
        {
          "service": "Text Area Field",
          "hull": "textareafield",
          "overwrite": true
        },
        {
          "service": "Url Field",
          "hull": "urlfield",
          "overwrite": true
        },
        {
          "service": "Opportunity Type",
          "hull": "opportunitytype",
          "overwrite": true
        }
      ]
    }
  },
  "route": "fetchAllOpportunities",
  "input": {
    "classType": {
      "service_name": "incoming_webpayload",
      "name": "WebPayload"
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "fetchAllOpportunities",
      "result": {
        "status": 200,
        "body": [
          {
            "id": 19438258,
            "name": "8 New Copy Machines (Sample - Try me!)",
            "assignee_id": 811206,
            "close_date": "1/14/2020",
            "company_id": 42412878,
            "company_name": "Copper",
            "customer_source_id": 1057492,
            "details": "Opportunities are created for People and Companies that are interested in buying your products or services. Create Opportunities for People and Companies to move them through one of your Pipelines.",
            "loss_reason_id": 973750,
            "pipeline_id": 685744,
            "pipeline_stage_id": 3211979,
            "primary_contact_id": 94693339,
            "priority": "Low",
            "status": "Open",
            "tags": ["sample"],
            "interaction_count": 0,
            "monetary_unit": "USD",
            "monetary_value": 250000.0,
            "converted_unit": "USD",
            "converted_value": "250000.0",
            "win_probability": 20,
            "date_stage_changed": 1577821902,
            "date_last_contacted": null,
            "leads_converted_from": [],
            "date_lead_created": null,
            "date_created": 1577804583,
            "date_modified": 1577821958,
            "custom_fields": [
              { "custom_field_definition_id": 378430, "value": true },
              { "custom_field_definition_id": 378431, "value": 567.0 },
              { "custom_field_definition_id": 378432, "value": 1575446400 },
              { "custom_field_definition_id": 378433, "value": 638296 },
              { "custom_field_definition_id": 378434, "value": [638299, 638301] },
              { "custom_field_definition_id": 378435, "value": 1232.0 },
              { "custom_field_definition_id": 378436, "value": 23 },
              { "custom_field_definition_id": 378437, "value": "some text" },
              { "custom_field_definition_id": 378438, "value": "www.somecompany.com" },
              { "custom_field_definition_id": 378472, "value": 638323 }
            ]
          },
          {
            "id": 19438259,
            "name": "25 Office Chairs (Sample - Try me!)",
            "assignee_id": 811206,
            "close_date": "1/7/2020",
            "company_id": 42412878,
            "company_name": "Copper",
            "customer_source_id": 1057493,
            "details": "Opportunities are created for People and Companies that are interested in buying your products or services. Create Opportunities for People and Companies to move them through one of your Pipelines.",
            "loss_reason_id": null,
            "pipeline_id": 685744,
            "pipeline_stage_id": 3211980,
            "primary_contact_id": 94693340,
            "priority": "None",
            "status": "Open",
            "tags": ["sample"],
            "interaction_count": 0,
            "monetary_unit": "USD",
            "monetary_value": 75000.0,
            "converted_unit": "USD",
            "converted_value": "75000.0",
            "win_probability": 40,
            "date_stage_changed": 1577804583,
            "date_last_contacted": null,
            "leads_converted_from": [],
            "date_lead_created": null,
            "date_created": 1577804583,
            "date_modified": 1577821971,
            "custom_fields": [
              { "custom_field_definition_id": 378430, "value": true },
              { "custom_field_definition_id": 378431, "value": 67.0 },
              { "custom_field_definition_id": 378432, "value": 1575273600 },
              { "custom_field_definition_id": 378433, "value": 638296 },
              { "custom_field_definition_id": 378434, "value": [638301] },
              { "custom_field_definition_id": 378435, "value": 34.0 },
              { "custom_field_definition_id": 378437, "value": "text area" },
              { "custom_field_definition_id": 378438, "value": "www.somecompany.com" },
              { "custom_field_definition_id": 378472, "value": 638324 },
              { "custom_field_definition_id": 378436, "value": null }
            ]
          },
          {
            "id": 19438261,
            "name": "500 Keyboards (Sample - Try me!)",
            "assignee_id": 811206,
            "close_date": "12/31/2019",
            "company_id": 42412878,
            "company_name": "Copper",
            "customer_source_id": 1057491,
            "details": "Opportunities are created for People and Companies that are interested in buying your products or services. Create Opportunities for People and Companies to move them through one of your Pipelines.",
            "loss_reason_id": 973749,
            "pipeline_id": 685744,
            "pipeline_stage_id": 3211978,
            "primary_contact_id": 94693341,
            "priority": "None",
            "status": "Lost",
            "tags": ["sample"],
            "interaction_count": 1,
            "monetary_unit": "USD",
            "monetary_value": 50000.0,
            "converted_unit": "USD",
            "converted_value": "50000.0",
            "win_probability": 10,
            "date_stage_changed": 1577804583,
            "date_last_contacted": 1576683480,
            "leads_converted_from": [],
            "date_lead_created": null,
            "date_created": 1577804583,
            "date_modified": 1577822084,
            "custom_fields": [
              { "custom_field_definition_id": 378472, "value": null },
              { "custom_field_definition_id": 378436, "value": null },
              { "custom_field_definition_id": 378438, "value": null },
              { "custom_field_definition_id": 378437, "value": null },
              { "custom_field_definition_id": 378435, "value": null },
              { "custom_field_definition_id": 378434, "value": [] },
              { "custom_field_definition_id": 378433, "value": null },
              { "custom_field_definition_id": 378432, "value": null },
              { "custom_field_definition_id": 378431, "value": null },
              { "custom_field_definition_id": 378430, "value": false }
            ]
          }
        ]
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getCustomFields",
      "result": {
        "status": 200,
        "text": "[{\"id\":378430,\"name\":\"Checkbox\",\"data_type\":\"Checkbox\",\"available_on\":[\"person\",\"lead\",\"company\",\"opportunity\"]},{\"id\":378431,\"name\":\"Currency Field\",\"data_type\":\"Currency\",\"available_on\":[\"person\",\"lead\",\"company\",\"opportunity\"],\"currency\":\"USD\"},{\"id\":378432,\"name\":\"Date Field\",\"data_type\":\"Date\",\"available_on\":[\"person\",\"lead\",\"company\",\"opportunity\"]},{\"id\":378433,\"name\":\"Dropdown Field\",\"data_type\":\"Dropdown\",\"available_on\":[\"opportunity\",\"person\",\"lead\",\"company\"],\"options\":[{\"id\":638296,\"name\":\"Option 1\",\"rank\":0},{\"id\":638297,\"name\":\"Option 2\",\"rank\":1},{\"id\":638298,\"name\":\"Option 3\",\"rank\":2}]},{\"id\":378434,\"name\":\"Multi Select Dropdown Field\",\"data_type\":\"MultiSelect\",\"available_on\":[\"opportunity\",\"person\",\"lead\",\"company\"],\"options\":[{\"id\":638299,\"name\":\"Option 1\",\"rank\":0},{\"id\":638300,\"name\":\"Option 2\",\"rank\":1},{\"id\":638301,\"name\":\"Option 3\",\"rank\":2}]},{\"id\":378435,\"name\":\"Number Field\",\"data_type\":\"Float\",\"available_on\":[\"opportunity\",\"person\",\"lead\",\"company\"]},{\"id\":378436,\"name\":\"Percentage Field\",\"data_type\":\"Percentage\",\"available_on\":[\"opportunity\",\"person\",\"lead\",\"company\"]},{\"id\":378437,\"name\":\"Text Area Field\",\"data_type\":\"Text\",\"available_on\":[\"opportunity\",\"person\",\"lead\",\"company\"]},{\"id\":378438,\"name\":\"Url Field\",\"data_type\":\"URL\",\"available_on\":[\"person\",\"lead\",\"company\",\"opportunity\"]},{\"id\":378443,\"name\":\"New Text Area\",\"data_type\":\"Text\",\"available_on\":[\"lead\"]},{\"id\":378445,\"name\":\"New Text Area2\",\"data_type\":\"Text\",\"available_on\":[\"lead\"]},{\"id\":378472,\"name\":\"Opportunity Type\",\"data_type\":\"Dropdown\",\"available_on\":[\"opportunity\"],\"options\":[{\"id\":638323,\"name\":\"New Business\",\"rank\":0},{\"id\":638324,\"name\":\"Upsell\",\"rank\":1},{\"id\":638325,\"name\":\"Cross Sell\",\"rank\":2}]}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getUsers",
      "result": {
        "status": 200,
        "text": "[{\"id\":811206,\"name\":\"Tim Liu\",\"email\":\"timliuhull3@gmail.com\"}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getCustomerSources",
      "result": {
        "status": 200,
        "text": "[{\"id\":1057493,\"name\":\"Advertising\"},{\"id\":1057492,\"name\":\"Cold Call\"},{\"id\":1057491,\"name\":\"Email\"}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getPipelines",
      "result": {
        "status": 200,
        "text": "[{\"id\":685744,\"name\":\"Sales\",\"stages\":[{\"id\":3211977,\"name\":\"Qualified\",\"win_probability\":5},{\"id\":3211978,\"name\":\"Follow-up\",\"win_probability\":10},{\"id\":3211979,\"name\":\"Presentation\",\"win_probability\":20},{\"id\":3211980,\"name\":\"Contract Sent\",\"win_probability\":40},{\"id\":3211981,\"name\":\"Negotiation\",\"win_probability\":80}]},{\"id\":685745,\"name\":\"Business Development\",\"stages\":[{\"id\":3211982,\"name\":\"First Meeting\",\"win_probability\":10},{\"id\":3211983,\"name\":\"Partner Meeting\",\"win_probability\":25},{\"id\":3211984,\"name\":\"Negotiation\",\"win_probability\":50},{\"id\":3211985,\"name\":\"Term Sheet\",\"win_probability\":75}]}]"
      }
    },
    {
      "localContext": expect.objectContaining({ "attributeId": 94693339 }),
      "name": "coppercrm",
      "op": "getPersonById",
      "result": {
        "status": 200,
        "text": "{\"id\":94693339,\"name\":\"Jon Lee (Sample - Try me!)\",\"prefix\":null,\"first_name\":\"Jon Lee (Sample - Try me!)\",\"middle_name\":null,\"last_name\":null,\"suffix\":null,\"address\":{\"street\":\"301 Howard Street\",\"city\":\"San Francisco\",\"state\":\"CA\",\"postal_code\":\"94105\",\"country\":null},\"assignee_id\":null,\"company_id\":42412878,\"company_name\":\"Copper\",\"contact_type_id\":1427442,\"details\":\"Jon started Copper to give every company tools they will actually use to help them grow.\",\"emails\":[{\"email\":\"jonl@copper.com\",\"category\":\"work\"}],\"phone_numbers\":[{\"number\":\"4153554776\",\"category\":\"work\"}],\"socials\":[{\"url\":\"https://www.linkedin.com/in/jonlee168\",\"category\":\"linkedin\"}],\"tags\":[\"sample\"],\"title\":\"Co-Founder\",\"websites\":[{\"url\":\"www.copper.com\",\"category\":\"work\"}],\"custom_fields\":[{\"custom_field_definition_id\":378436,\"value\":null},{\"custom_field_definition_id\":378438,\"value\":null},{\"custom_field_definition_id\":378437,\"value\":null},{\"custom_field_definition_id\":378435,\"value\":null},{\"custom_field_definition_id\":378434,\"value\":[]},{\"custom_field_definition_id\":378433,\"value\":null},{\"custom_field_definition_id\":378432,\"value\":null},{\"custom_field_definition_id\":378431,\"value\":null},{\"custom_field_definition_id\":378430,\"value\":false}],\"date_created\":1577804581,\"date_modified\":1577804586,\"date_last_contacted\":null,\"interaction_count\":0,\"leads_converted_from\":[],\"date_lead_created\":null}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asOpportunity",
      "input": {
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "userIdent": {
          "anonymous_id": "coppercrm-person:person-94693339"
        },
        "attributes": {
          "coppercrm_opportunity_New Business/id": {
            "value": 19438258,
            "operation": "set"
          },
          "coppercrm_opportunity_New Business/oppname": {
            "operation": "set",
            "value": "8 New Copy Machines (Sample - Try me!)"
          },
          "coppercrm_opportunity_New Business/assigneeid": {
            "operation": "set",
            "value": 811206
          },
          "coppercrm_opportunity_New Business/assigneeemail": {
            "operation": "set",
            "value": "timliuhull3@gmail.com"
          },
          "coppercrm_opportunity_New Business/closedate_at": {
            "operation": "set",
            "value": "2020-01-14T05:00:00.000Z"
          },
          "coppercrm_opportunity_New Business/company_id": {
            "operation": "set",
            "value": 42412878
          },
          "coppercrm_opportunity_New Business/companyname": {
            "operation": "set",
            "value": "Copper"
          },
          "coppercrm_opportunity_New Business/customersourceid": {
            "operation": "set",
            "value": 1057492
          },
          "coppercrm_opportunity_New Business/customersource": {
            "operation": "setIfNull",
            "value": "Cold Call"
          },
          "coppercrm_opportunity_New Business/details": {
            "operation": "set",
            "value": "Opportunities are created for People and Companies that are interested in buying your products or services. Create Opportunities for People and Companies to move them through one of your Pipelines."
          },
          "coppercrm_opportunity_New Business/lossreasonid": {
            "operation": "set",
            "value": 973750
          },
          "coppercrm_opportunity_New Business/lossreasonname": {
            "operation": "set",
            "value": "Features"
          },
          "coppercrm_opportunity_New Business/pipelineid": {
            "operation": "set",
            "value": 685744
          },
          "coppercrm_opportunity_New Business/pipelinename": {
            "operation": "set",
            "value": "Sales"
          },
          "coppercrm_opportunity_New Business/pipelinestageid": {
            "operation": "set",
            "value": 3211979
          },
          "coppercrm_opportunity_New Business/pipelinestagename": {
            "operation": "set",
            "value": "Presentation"
          },
          "coppercrm_opportunity_New Business/primarycontactid": {
            "operation": "set",
            "value": 94693339
          },
          "coppercrm_opportunity_New Business/primarycontactemail": {
            "operation": "set",
            "value": "jonl@copper.com"
          },
          "coppercrm_opportunity_New Business/priority": {
            "operation": "set",
            "value": "Low"
          },
          "coppercrm_opportunity_New Business/status": {
            "operation": "set",
            "value": "Open"
          },
          "coppercrm_opportunity_New Business/tags": {
            "operation": "set",
            "value": [
              "sample"
            ]
          },
          "coppercrm_opportunity_New Business/interactioncount": {
            "operation": "set",
            "value": 0
          },
          "coppercrm_opportunity_New Business/monitaryunit": {
            "operation": "set",
            "value": "USD"
          },
          "coppercrm_opportunity_New Business/monetary_value": {
            "operation": "set",
            "value": 250000
          },
          "coppercrm_opportunity_New Business/convertedunit": {
            "operation": "set",
            "value": "USD"
          },
          "coppercrm_opportunity_New Business/convertedvalue": {
            "operation": "set",
            "value": "250000.0"
          },
          "coppercrm_opportunity_New Business/winprobability": {
            "operation": "setIfNull",
            "value": 20
          },
          "coppercrm_opportunity_New Business/datestagechanged_at": {
            "operation": "set",
            "value": 1577821902
          },
          "coppercrm_opportunity_New Business/datelastcontacted_at": {
            "operation": "set",
            "value": null
          },
          "coppercrm_opportunity_New Business/dateleadcreated_at": {
            "operation": "setIfNull",
            "value": null
          },
          "coppercrm_opportunity_New Business/datecreated": {
            "operation": "set",
            "value": 1577804583
          },
          "coppercrm_opportunity_New Business/datemodified_at": {
            "operation": "setIfNull",
            "value": 1577821958
          },
          "coppercrm_opportunity_New Business/checkbox": {
            "operation": "set",
            "value": true
          },
          "coppercrm_opportunity_New Business/currencyfield": {
            "operation": "set",
            "value": 567
          },
          "coppercrm_opportunity_New Business/datefield": {
            "operation": "set",
            "value": 1575446400
          },
          "coppercrm_opportunity_New Business/dropdownfield": {
            "operation": "set",
            "value": "Option 1"
          },
          "coppercrm_opportunity_New Business/multiselectfield": {
            "operation": "setIfNull",
            "value": [
              "Option 1",
              "Option 3"
            ]
          },
          "coppercrm_opportunity_New Business/numberfield": {
            "operation": "set",
            "value": 1232
          },
          "coppercrm_opportunity_New Business/percentagefield": {
            "operation": "set",
            "value": 23
          },
          "coppercrm_opportunity_New Business/textareafield": {
            "operation": "set",
            "value": "some text"
          },
          "coppercrm_opportunity_New Business/urlfield": {
            "operation": "set",
            "value": "www.somecompany.com"
          },
          "coppercrm_opportunity_New Business/opportunitytype": {
            "operation": "set",
            "value": "New Business"
          }
        }
      },
      "result": {}
    },
    {
      "localContext": expect.objectContaining({ "attributeId": 94693340 }),
      "name": "coppercrm",
      "op": "getPersonById",
      "result": {
        "status": 200,
        "body": {
          "id": 94693340,
          "emails": [{ "email": "othercontact@copper.com", "category": "work" }],
          "phone_numbers": [{ "number": "4153554776", "category": "work" }]
        }
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asOpportunity",
      "input": {
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "userIdent": {
          "anonymous_id": "coppercrm-person:person-94693340"
        },
        "attributes": {
          "coppercrm_opportunity_Upsell/id": {
            "value": 19438259,
            "operation": "set"
          },
          "coppercrm_opportunity_Upsell/oppname": {
            "operation": "set",
            "value": "25 Office Chairs (Sample - Try me!)"
          },
          "coppercrm_opportunity_Upsell/assigneeid": {
            "operation": "set",
            "value": 811206
          },
          "coppercrm_opportunity_Upsell/assigneeemail": {
            "operation": "set",
            "value": "timliuhull3@gmail.com"
          },
          "coppercrm_opportunity_Upsell/closedate_at": {
            "operation": "set",
            "value": "2020-01-07T05:00:00.000Z"
          },
          "coppercrm_opportunity_Upsell/company_id": {
            "operation": "set",
            "value": 42412878
          },
          "coppercrm_opportunity_Upsell/companyname": {
            "operation": "set",
            "value": "Copper"
          },
          "coppercrm_opportunity_Upsell/customersourceid": {
            "operation": "set",
            "value": 1057493
          },
          "coppercrm_opportunity_Upsell/customersource": {
            "operation": "setIfNull",
            "value": "Advertising"
          },
          "coppercrm_opportunity_Upsell/details": {
            "operation": "set",
            "value": "Opportunities are created for People and Companies that are interested in buying your products or services. Create Opportunities for People and Companies to move them through one of your Pipelines."
          },
          "coppercrm_opportunity_Upsell/lossreasonid": {
            "operation": "set",
            "value": null
          },
          "coppercrm_opportunity_Upsell/lossreasonname": {
            "operation": "set",
            "value": null
          },
          "coppercrm_opportunity_Upsell/pipelineid": {
            "operation": "set",
            "value": 685744
          },
          "coppercrm_opportunity_Upsell/pipelinename": {
            "operation": "set",
            "value": "Sales"
          },
          "coppercrm_opportunity_Upsell/pipelinestageid": {
            "operation": "set",
            "value": 3211980
          },
          "coppercrm_opportunity_Upsell/pipelinestagename": {
            "operation": "set",
            "value": "Contract Sent"
          },
          "coppercrm_opportunity_Upsell/primarycontactid": {
            "operation": "set",
            "value": 94693340
          },
          "coppercrm_opportunity_Upsell/primarycontactemail": {
            "operation": "set",
            "value": "othercontact@copper.com"
          },
          "coppercrm_opportunity_Upsell/priority": {
            "operation": "set",
            "value": "None"
          },
          "coppercrm_opportunity_Upsell/status": {
            "operation": "set",
            "value": "Open"
          },
          "coppercrm_opportunity_Upsell/tags": {
            "operation": "set",
            "value": [
              "sample"
            ]
          },
          "coppercrm_opportunity_Upsell/interactioncount": {
            "operation": "set",
            "value": 0
          },
          "coppercrm_opportunity_Upsell/monitaryunit": {
            "operation": "set",
            "value": "USD"
          },
          "coppercrm_opportunity_Upsell/monetary_value": {
            "operation": "set",
            "value": 75000
          },
          "coppercrm_opportunity_Upsell/convertedunit": {
            "operation": "set",
            "value": "USD"
          },
          "coppercrm_opportunity_Upsell/convertedvalue": {
            "operation": "set",
            "value": "75000.0"
          },
          "coppercrm_opportunity_Upsell/winprobability": {
            "operation": "setIfNull",
            "value": 40
          },
          "coppercrm_opportunity_Upsell/datestagechanged_at": {
            "operation": "set",
            "value": 1577804583
          },
          "coppercrm_opportunity_Upsell/datelastcontacted_at": {
            "operation": "set",
            "value": null
          },
          "coppercrm_opportunity_Upsell/dateleadcreated_at": {
            "operation": "setIfNull",
            "value": null
          },
          "coppercrm_opportunity_Upsell/datecreated": {
            "operation": "set",
            "value": 1577804583
          },
          "coppercrm_opportunity_Upsell/datemodified_at": {
            "operation": "setIfNull",
            "value": 1577821971
          },
          "coppercrm_opportunity_Upsell/checkbox": {
            "operation": "set",
            "value": true
          },
          "coppercrm_opportunity_Upsell/currencyfield": {
            "operation": "set",
            "value": 67
          },
          "coppercrm_opportunity_Upsell/datefield": {
            "operation": "set",
            "value": 1575273600
          },
          "coppercrm_opportunity_Upsell/dropdownfield": {
            "operation": "set",
            "value": "Option 1"
          },
          "coppercrm_opportunity_Upsell/multiselectfield": {
            "operation": "setIfNull",
            "value": [
              "Option 3"
            ]
          },
          "coppercrm_opportunity_Upsell/numberfield": {
            "operation": "set",
            "value": 34
          },
          "coppercrm_opportunity_Upsell/percentagefield": {
            "operation": "set",
            "value": null
          },
          "coppercrm_opportunity_Upsell/textareafield": {
            "operation": "set",
            "value": "text area"
          },
          "coppercrm_opportunity_Upsell/urlfield": {
            "operation": "set",
            "value": "www.somecompany.com"
          },
          "coppercrm_opportunity_Upsell/opportunitytype": {
            "operation": "set",
            "value": "Upsell"
          }
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getLossReasons",
      "result": {
        "status": 200,
        "text": "[{\"id\":973751,\"name\":\"Competitor\"},{\"id\":973750,\"name\":\"Features\"},{\"id\":973749,\"name\":\"Price\"}]"
      }
    },
    {
      "localContext": expect.objectContaining({ "attributeId": 94693341 }),
      "name": "coppercrm",
      "op": "getPersonById",
      "result": {
        "status": 200,
        "body": {
          "id": 94693341,
          "emails": [{ "email": "anothercontact@copper.com", "category": "work" }],
          "phone_numbers": [{ "number": "4153554776", "category": "work" }]
        }
      }
    },
    {
      // currently we pass through this data for opportunities with no type
      // the hull-service skips if no attributes exist...
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asOpportunity",
      "input": {
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "userIdent": {
          "anonymous_id": "coppercrm-person:person-94693341"
        }
      }
    }
  ],
  "result": expect.anything()
};

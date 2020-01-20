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
      "link_person_in_hull": true,
      "account_claims": [
        {
          "hull": "domain",
          "service": "email_domain"
        }
      ],
      "flow_control_user_update_success_size": "100",
      "flow_control_account_update_success_size": "100",
      "activities_to_fetch": [
        "0",
        "908224",
        "908223",
        "908222"
      ],
      "coppercrm_api_key": "apikeyshhh",
      "coppercrm_email": "timliuhull3@gmail.com",
      "deleteLeadWebhookId": 113358,
      "deletePersonWebhookId": 113359,
      "deleteCompanyWebhookId": 113360,
      "deleteOpportunityWebhookId": 113361,
      "last_fetchRecentActivities": 1577998980,
      "last_fetchRecentCompanies": 1577998981,
      "last_fetchRecentPeople": 1577998980,
      "last_fetchRecentLeads": 1577997001,
      "last_fetchRecentOpportunities": 1578000300,
      "incoming_opportunity_attributes": [
        {
          "service": "customer_source_id",
          "hull": "sourceid",
          "overwrite": true
        },
        {
          "service": "customerSource",
          "hull": "customersourcename",
          "overwrite": true
        }
      ],
      "incoming_opportunity_type": "Opportunity Type"
    }
  },
  "route": "fetchRecentOpportunities",
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
      "op": "fetchRecentOpportunities",
      "result": {
        "status": 200,
        "body": [
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
            "primary_contact_id": 94693339,
            "priority": "None",
            "status": "Lost",
            "tags": ["sample"],
            "interaction_count": 3,
            "monetary_unit": "USD",
            "monetary_value": 50000.0,
            "converted_unit": "USD",
            "converted_value": "50000.0",
            "win_probability": 10,
            "date_stage_changed": 1577804583,
            "date_last_contacted": 1577995220,
            "leads_converted_from": [],
            "date_lead_created": null,
            "date_created": 1577804583,
            "date_modified": 1577997451,
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
            "primary_contact_id": 94693339,
            "priority": "None",
            "status": "Open",
            "tags": ["sample"],
            "interaction_count": 1,
            "monetary_unit": "USD",
            "monetary_value": 75000.0,
            "converted_unit": "USD",
            "converted_value": "75000.0",
            "win_probability": 70,
            "date_stage_changed": 1577804583,
            "date_last_contacted": 1572813420,
            "leads_converted_from": [],
            "date_lead_created": null,
            "date_created": 1577804583,
            "date_modified": 1578000300,
            "custom_fields": [
              { "custom_field_definition_id": 378430, "value": false },
              { "custom_field_definition_id": 378431, "value": 67.0 },
              { "custom_field_definition_id": 378432, "value": 1575273600 },
              { "custom_field_definition_id": 378433, "value": 638296 },
              { "custom_field_definition_id": 378434, "value": [638301] },
              { "custom_field_definition_id": 378435, "value": 34.0 },
              { "custom_field_definition_id": 378437, "value": "text area" },
              { "custom_field_definition_id": 378438, "value": "www.somecompany.com" },
              { "custom_field_definition_id": 378472, "value": 638325 },
              { "custom_field_definition_id": 378436, "value": null }
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
      "op": "getCustomerSources",
      "result": {
        "status": 200,
        "text": "[{\"id\":1057493,\"name\":\"Advertising\"},{\"id\":1057492,\"name\":\"Cold Call\"},{\"id\":1057491,\"name\":\"Email\"}]"
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
          "anonymous_id": "coppercrm-person:person-94693339"
        },
        "attributes": {
          "coppercrm_opportunity_Cross Sell/id": {
            "value": 19438259,
            "operation": "set"
          },
          "coppercrm_opportunity_Cross Sell/sourceid": {
            "operation": "set",
            "value": 1057493
          },
          "coppercrm_opportunity_Cross Sell/customersourcename": {
            "operation": "set",
            "value": "Advertising"
          }
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "settingsUpdate",
      "input": {
        "last_fetchRecentOpportunities": 1578000300
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}

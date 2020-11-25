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
      "coppercrm_api_key": "copperapikeyshhh",
      "coppercrm_email": "timliuhull3@gmail.com",
      "deleteLeadWebhookId": 113358,
      "deletePersonWebhookId": 113359,
      "deleteCompanyWebhookId": 113360,
      "deleteOpportunityWebhookId": 113361,
      "incoming_person_attributes": [
        {
          "service": "name",
          "hull": "coppercrm_person/name",
          "overwrite": true
        },
        {
          "service": "first_name",
          "hull": "coppercrm_person/first",
          "overwrite": true
        },
        {
          "service": "last_name",
          "hull": "coppercrm_person/last",
          "overwrite": true
        },
        {
          "service": "assignee_id",
          "hull": "coppercrm_person/assigneeid",
          "overwrite": true
        },
        {
          "service": "assigneeEmail",
          "hull": "coppercrm_person/assigneeemail",
          "overwrite": true
        },
        {
          "service": "contactType",
          "hull": "coppercrm_person/contacttype",
          "overwrite": true
        },
        {
          "service": "contact_type_id",
          "hull": "coppercrm_person/contacttypeid",
          "overwrite": true
        },
        {
          "service": "title",
          "hull": "coppercrm_person/title",
          "overwrite": true
        },
        {
          "service": "status",
          "hull": "coppercrm_person/status",
          "overwrite": true
        },
        {
          "service": "status_id",
          "hull": "coppercrm_person/statusid",
          "overwrite": true
        }
      ]
    }
  },
  "route": "fetchAllPeople",
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
      "op": "fetchAllPeople",
      "result": {
        "status": 200,
        "text": "[{\"id\":94693339,\"name\":\"Jon Lee (Sample - Try me!)\",\"prefix\":null,\"first_name\":\"Jon Lee (Sample - Try me!)\",\"middle_name\":null,\"last_name\":null,\"suffix\":null,\"address\":{\"street\":\"301 Howard Street\",\"city\":\"San Francisco\",\"state\":\"CA\",\"postal_code\":\"94105\",\"country\":null},\"assignee_id\":null,\"company_id\":42412878,\"company_name\":\"Copper\",\"contact_type_id\":1427442,\"details\":\"Jon started Copper to give every company tools they will actually use to help them grow.\",\"emails\":[{\"email\":\"jonl@copper.com\",\"category\":\"work\"}],\"phone_numbers\":[{\"number\":\"4153554776\",\"category\":\"work\"}],\"socials\":[{\"url\":\"https://www.linkedin.com/in/jonlee168\",\"category\":\"linkedin\"}],\"tags\":[\"sample\"],\"title\":\"Co-Founder\",\"websites\":[{\"url\":\"www.copper.com\",\"category\":\"work\"}],\"custom_fields\":[{\"custom_field_definition_id\":378430,\"value\":true},{\"custom_field_definition_id\":378436,\"value\":null},{\"custom_field_definition_id\":378438,\"value\":null},{\"custom_field_definition_id\":378437,\"value\":null},{\"custom_field_definition_id\":378435,\"value\":null},{\"custom_field_definition_id\":378434,\"value\":[]},{\"custom_field_definition_id\":378433,\"value\":null},{\"custom_field_definition_id\":378432,\"value\":null},{\"custom_field_definition_id\":378431,\"value\":null}],\"date_created\":1577804581,\"date_modified\":1578000489,\"date_last_contacted\":1572813420,\"interaction_count\":1,\"leads_converted_from\":[],\"date_lead_created\":null},{\"id\":94693340,\"name\":\"Liz García (Sample - Try me!)\",\"prefix\":null,\"first_name\":\"Liz García (Sample - Try me!)\",\"middle_name\":null,\"last_name\":null,\"suffix\":null,\"address\":{\"street\":\"301 Howard Street\",\"city\":\"San Francisco\",\"state\":\"CA\",\"postal_code\":\"94105\",\"country\":null},\"assignee_id\":null,\"company_id\":42412878,\"company_name\":\"Copper\",\"contact_type_id\":1427442,\"details\":null,\"emails\":[{\"email\":\"lizg@copper.com\",\"category\":\"work\"}],\"phone_numbers\":[{\"number\":\"4153554776\",\"category\":\"work\"}],\"socials\":[{\"url\":\"https://www.linkedin.com/in/elizabethmgonzalez\",\"category\":\"linkedin\"}],\"tags\":[\"sample\"],\"title\":\"Product Marketing\",\"websites\":[{\"url\":\"www.copper.com\",\"category\":\"work\"}],\"custom_fields\":[{\"custom_field_definition_id\":378436,\"value\":null},{\"custom_field_definition_id\":378438,\"value\":null},{\"custom_field_definition_id\":378437,\"value\":null},{\"custom_field_definition_id\":378435,\"value\":null},{\"custom_field_definition_id\":378434,\"value\":[]},{\"custom_field_definition_id\":378433,\"value\":null},{\"custom_field_definition_id\":378432,\"value\":null},{\"custom_field_definition_id\":378431,\"value\":null},{\"custom_field_definition_id\":378430,\"value\":false}],\"date_created\":1577804581,\"date_modified\":1577998980,\"date_last_contacted\":1577998920,\"interaction_count\":1,\"leads_converted_from\":[],\"date_lead_created\":null},{\"id\":94693341,\"name\":\"Siena West (Sample - Try me!)\",\"prefix\":null,\"first_name\":\"Siena West (Sample - Try me!)\",\"middle_name\":null,\"last_name\":null,\"suffix\":null,\"address\":{\"street\":\"301 Howard Street\",\"city\":\"San Francisco\",\"state\":\"CA\",\"postal_code\":\"94105\",\"country\":null},\"assignee_id\":null,\"company_id\":42412878,\"company_name\":\"Copper\",\"contact_type_id\":1427439,\"details\":null,\"emails\":[{\"email\":\"sienaw@copper.com\",\"category\":\"work\"}],\"phone_numbers\":[{\"number\":\"4152225466\",\"category\":\"work\"}],\"socials\":[],\"tags\":[\"sample\"],\"title\":\"Marketing Automation Manager\",\"websites\":[{\"url\":\"www.copper.com\",\"category\":\"work\"}],\"custom_fields\":[{\"custom_field_definition_id\":378436,\"value\":null},{\"custom_field_definition_id\":378438,\"value\":null},{\"custom_field_definition_id\":378437,\"value\":null},{\"custom_field_definition_id\":378435,\"value\":null},{\"custom_field_definition_id\":378434,\"value\":[]},{\"custom_field_definition_id\":378433,\"value\":null},{\"custom_field_definition_id\":378432,\"value\":null},{\"custom_field_definition_id\":378431,\"value\":null},{\"custom_field_definition_id\":378430,\"value\":false}],\"date_created\":1577804582,\"date_modified\":1577804586,\"date_last_contacted\":null,\"interaction_count\":0,\"leads_converted_from\":[],\"date_lead_created\":null},{\"id\":94693342,\"name\":\"Brittany Hughes (Sample - Try me!)\",\"prefix\":null,\"first_name\":\"Brittany Hughes (Sample - Try me!)\",\"middle_name\":null,\"last_name\":null,\"suffix\":null,\"address\":{\"street\":\"301 Howard Street\",\"city\":\"San Francisco\",\"state\":\"CA\",\"postal_code\":\"94105\",\"country\":null},\"assignee_id\":null,\"company_id\":42412878,\"company_name\":\"Copper\",\"contact_type_id\":1427439,\"details\":null,\"emails\":[{\"email\":\"bhuges@copper.com\",\"category\":\"work\"}],\"phone_numbers\":[],\"socials\":[],\"tags\":[\"sample\",\"some tag\"],\"title\":\"Lead Product Designer\",\"websites\":[],\"custom_fields\":[{\"custom_field_definition_id\":378430,\"value\":true},{\"custom_field_definition_id\":378431,\"value\":78.0},{\"custom_field_definition_id\":378432,\"value\":1575446400},{\"custom_field_definition_id\":378433,\"value\":638297},{\"custom_field_definition_id\":378434,\"value\":[638299,638300]},{\"custom_field_definition_id\":378435,\"value\":23.0},{\"custom_field_definition_id\":378436,\"value\":34},{\"custom_field_definition_id\":378437,\"value\":\"ome text\"},{\"custom_field_definition_id\":378438,\"value\":\"www.urjanet.com\"}],\"date_created\":1577804582,\"date_modified\":1577995221,\"date_last_contacted\":1577995220,\"interaction_count\":2,\"leads_converted_from\":[],\"date_lead_created\":null},{\"id\":94693343,\"name\":\"Jason Hoyt (Sample - Try me!)\",\"prefix\":null,\"first_name\":\"Jason Hoyt (Sample - Try me!)\",\"middle_name\":null,\"last_name\":null,\"suffix\":null,\"address\":{\"street\":\"301 Howard Street\",\"city\":\"San Francisco\",\"state\":\"CA\",\"postal_code\":\"94105\",\"country\":null},\"assignee_id\":null,\"company_id\":42412878,\"company_name\":\"Copper\",\"contact_type_id\":1427442,\"details\":null,\"emails\":[{\"email\":\"jhoyt@copper.com\",\"category\":\"work\"}],\"phone_numbers\":[{\"number\":\"4158546956\",\"category\":\"work\"}],\"socials\":[{\"url\":\"https://www.linkedin.com/in/taylorlowe11\",\"category\":\"linkedin\"}],\"tags\":[\"sample\"],\"title\":\"Business Development\",\"websites\":[{\"url\":\"www.copper.com\",\"category\":\"work\"}],\"custom_fields\":[{\"custom_field_definition_id\":378436,\"value\":null},{\"custom_field_definition_id\":378438,\"value\":null},{\"custom_field_definition_id\":378437,\"value\":null},{\"custom_field_definition_id\":378435,\"value\":null},{\"custom_field_definition_id\":378434,\"value\":[]},{\"custom_field_definition_id\":378433,\"value\":null},{\"custom_field_definition_id\":378432,\"value\":null},{\"custom_field_definition_id\":378431,\"value\":null},{\"custom_field_definition_id\":378430,\"value\":false}],\"date_created\":1577804582,\"date_modified\":1577804586,\"date_last_contacted\":null,\"interaction_count\":0,\"leads_converted_from\":[],\"date_lead_created\":null}]"
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
      "op": "getContactTypes",
      "result": {
        "status": 200,
        "text": "[{\"id\":1427439,\"name\":\"Potential Customer\"},{\"id\":1427440,\"name\":\"Current Customer\"},{\"id\":1427441,\"name\":\"Uncategorized\"},{\"id\":1427442,\"name\":\"Other\"}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "jonl@copper.com",
          "anonymous_id": "coppercrm-person:person-94693339",
          "anonymous_ids": []
        },
        "attributes": {
          "name": {
            "operation": "setIfNull",
            "value": "Jon Lee (Sample - Try me!)"
          },
          "coppercrm_person/name": {
            "operation": "set",
            "value": "Jon Lee (Sample - Try me!)"
          },
          "coppercrm_person/first": {
            "operation": "set",
            "value": "Jon Lee (Sample - Try me!)"
          },
          "coppercrm_person/last": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeid": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeemail": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/contacttype": {
            "operation": "set",
            "value": "Other"
          },
          "coppercrm_person/contacttypeid": {
            "operation": "set",
            "value": 1427442
          },
          "coppercrm_person/title": {
            "operation": "set",
            "value": "Co-Founder"
          },
          "coppercrm_person/id": {
            "value": 94693339,
            "operation": "set"
          }
        },
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "accountAttributes": {
          "coppercrm/id": 42412878
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "lizg@copper.com",
          "anonymous_id": "coppercrm-person:person-94693340",
          "anonymous_ids": []
        },
        "attributes": {
          "name": {
            "operation": "setIfNull",
            "value": "Liz García (Sample - Try me!)"
          },
          "coppercrm_person/name": {
            "operation": "set",
            "value": "Liz García (Sample - Try me!)"
          },
          "coppercrm_person/first": {
            "operation": "set",
            "value": "Liz García (Sample - Try me!)"
          },
          "coppercrm_person/last": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeid": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeemail": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/contacttype": {
            "operation": "set",
            "value": "Other"
          },
          "coppercrm_person/contacttypeid": {
            "operation": "set",
            "value": 1427442
          },
          "coppercrm_person/title": {
            "operation": "set",
            "value": "Product Marketing"
          },
          "coppercrm_person/id": {
            "value": 94693340,
            "operation": "set"
          }
        },
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "accountAttributes": {
          "coppercrm/id": 42412878
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "sienaw@copper.com",
          "anonymous_id": "coppercrm-person:person-94693341",
          "anonymous_ids": []
        },
        "attributes": {
          "name": {
            "operation": "setIfNull",
            "value": "Siena West (Sample - Try me!)"
          },
          "coppercrm_person/name": {
            "operation": "set",
            "value": "Siena West (Sample - Try me!)"
          },
          "coppercrm_person/first": {
            "operation": "set",
            "value": "Siena West (Sample - Try me!)"
          },
          "coppercrm_person/last": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeid": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeemail": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/contacttype": {
            "operation": "set",
            "value": "Potential Customer"
          },
          "coppercrm_person/contacttypeid": {
            "operation": "set",
            "value": 1427439
          },
          "coppercrm_person/title": {
            "operation": "set",
            "value": "Marketing Automation Manager"
          },
          "coppercrm_person/id": {
            "value": 94693341,
            "operation": "set"
          }
        },
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "accountAttributes": {
          "coppercrm/id": 42412878
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "bhuges@copper.com",
          "anonymous_id": "coppercrm-person:person-94693342",
          "anonymous_ids": []
        },
        "attributes": {
          "name": {
            "operation": "setIfNull",
            "value": "Brittany Hughes (Sample - Try me!)"
          },
          "coppercrm_person/name": {
            "operation": "set",
            "value": "Brittany Hughes (Sample - Try me!)"
          },
          "coppercrm_person/first": {
            "operation": "set",
            "value": "Brittany Hughes (Sample - Try me!)"
          },
          "coppercrm_person/last": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeid": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeemail": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/contacttype": {
            "operation": "set",
            "value": "Potential Customer"
          },
          "coppercrm_person/contacttypeid": {
            "operation": "set",
            "value": 1427439
          },
          "coppercrm_person/title": {
            "operation": "set",
            "value": "Lead Product Designer"
          },
          "coppercrm_person/id": {
            "value": 94693342,
            "operation": "set"
          }
        },
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "accountAttributes": {
          "coppercrm/id": 42412878
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "jhoyt@copper.com",
          "anonymous_id": "coppercrm-person:person-94693343",
          "anonymous_ids": []
        },
        "attributes": {
          "name": {
            "operation": "setIfNull",
            "value": "Jason Hoyt (Sample - Try me!)"
          },
          "coppercrm_person/name": {
            "operation": "set",
            "value": "Jason Hoyt (Sample - Try me!)"
          },
          "coppercrm_person/first": {
            "operation": "set",
            "value": "Jason Hoyt (Sample - Try me!)"
          },
          "coppercrm_person/last": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeid": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/assigneeemail": {
            "operation": "set",
            "value": null
          },
          "coppercrm_person/contacttype": {
            "operation": "set",
            "value": "Other"
          },
          "coppercrm_person/contacttypeid": {
            "operation": "set",
            "value": 1427442
          },
          "coppercrm_person/title": {
            "operation": "set",
            "value": "Business Development"
          },
          "coppercrm_person/id": {
            "value": 94693343,
            "operation": "set"
          }
        },
        "accountIdent": {
          "anonymous_id": "coppercrm:42412878"
        },
        "accountAttributes": {
          "coppercrm/id": 42412878
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}

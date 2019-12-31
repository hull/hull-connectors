module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
      "deletePersonWebhookId": 113241,
      "flow_control_user_update_success_size": "100",
      "activities_to_fetch": [],
      "coppercrm_api_key": "someapikeysshhh",
      "lead_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "coppercrm_email": "timliuhull3@gmail.com",
      "flow_control_account_update_success_size": "100",
      "last_fetchRecentCompanies": 1577816042,
      "deleteOpportunityWebhookId": 113243,
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
      "deleteCompanyWebhookId": 113242,
      "incoming_account_attributes": [
        {
          "service": "name",
          "hull": "coppercrm/name",
          "overwrite": false
        },
        {
          "service": "addressStreet",
          "hull": "coppercrm/street",
          "overwrite": true
        },
        {
          "service": "addressCity",
          "hull": "coppercrm/city",
          "overwrite": true
        },
        {
          "service": "addressState",
          "hull": "coppercrm/state",
          "overwrite": true
        },
        {
          "service": "addressPostalCode",
          "hull": "coppercrm/zip",
          "overwrite": true
        },
        {
          "service": "addressCountry",
          "hull": "coppercrm/country",
          "overwrite": true
        },
        {
          "service": "assignee_id",
          "hull": "coppercrm/assigneeid",
          "overwrite": true
        },
        {
          "service": "assigneeEmail",
          "hull": "coppercrm/owneremail",
          "overwrite": true
        },
        {
          "service": "contact_type_id",
          "hull": "coppercrm/contacttypeid",
          "overwrite": true
        },
        {
          "service": "contactType",
          "hull": "coppercrm/contacttypename",
          "overwrite": true
        },
        {
          "service": "details",
          "hull": "coppercrm/details",
          "overwrite": true
        },
        {
          "service": "email_domain",
          "hull": "coppercrm/emaildomain",
          "overwrite": true
        },
        {
          "service": "phone_numbers",
          "hull": "coppercrm/numbers",
          "overwrite": true
        },
        {
          "service": "socials",
          "hull": "coppercrm/socials",
          "overwrite": true
        },
        {
          "service": "tags",
          "hull": "coppercrm/tags",
          "overwrite": true
        },
        {
          "service": "websites",
          "hull": "coppercrm/websitesjson",
          "overwrite": true
        },
        {
          "service": "interaction_count",
          "hull": "coppercrm/interactioncount",
          "overwrite": true
        },
        {
          "service": "date_created",
          "hull": "coppercrm/created",
          "overwrite": true
        },
        {
          "service": "date_modified",
          "hull": "coppercrm/modified_at",
          "overwrite": true
        },
        {
          "service": "Checkbox",
          "hull": "coppercrm/checkbox",
          "overwrite": true
        },
        {
          "service": "Currency Field",
          "hull": "coppercrm/currency",
          "overwrite": true
        },
        {
          "service": "Date Field",
          "hull": "coppercrm/date",
          "overwrite": true
        },
        {
          "service": "Dropdown Field",
          "hull": "coppercrm/dropdownfield",
          "overwrite": true
        },
        {
          "service": "Multi Select Dropdown Field",
          "hull": "coppercrm/multifield",
          "overwrite": true
        },
        {
          "service": "Number Field",
          "hull": "coppercrm/numberfield",
          "overwrite": true
        },
        {
          "service": "Percentage Field",
          "hull": "coppercrm/percentagefield",
          "overwrite": true
        },
        {
          "service": "Text Area Field",
          "hull": "coppercrm/areafield",
          "overwrite": true
        },
        {
          "service": "Url Field",
          "hull": "coppercrm/urlfield",
          "overwrite": true
        }
      ],
      "deleteLeadWebhookId": 113240,
      "link_person_in_hull": false
    }
  },
  "route": "fetchAllCompanies",
  "input": {
    "classType": {
      "service_name": "incoming_webpayload",
      "name": "WebPayload"
    }
  },
  "serviceRequests": [
    {
      "localContext": [
        {
          "service_name": "coppercrm",
          "webhookUrl": "https://connectortest.connectordomain.io/webhooks?organization=organization.hullapp.io&secret=shhh&ship=5c092905c36af496c700012e",
          "pageOffset": 1,
          "pageSize": 100,
          "datePathOnEntity": "date_created"
        }
      ],
      "name": "coppercrm",
      "op": "fetchAllCompanies",
      "result": {
        "status": 200,
        "body": [
          {
            "id": 42412878,
            "name": "Copper",
            "address": {
              "street": "301 Howard Street",
              "city": "San Francisco",
              "state": "CA",
              "postal_code": "94105",
              "country": null
            },
            "assignee_id": 811206,
            "contact_type_id": 1427442,
            "details": "A crm that works for you, so you can spend time on relationships instead of data.",
            "email_domain": "copper.com",
            "phone_numbers": [{ "number": "4153554776", "category": "work" }],
            "socials": [],
            "tags": ["sample"],
            "websites": [{ "url": "www.copper.com", "category": "work" }],
            "custom_fields": [
              { "custom_field_definition_id": 378430, "value": true },
              { "custom_field_definition_id": 378431, "value": 34.0 },
              { "custom_field_definition_id": 378432, "value": 1575705600 },
              { "custom_field_definition_id": 378433, "value": 638296 },
              { "custom_field_definition_id": 378434, "value": [638299, 638300] },
              { "custom_field_definition_id": 378435, "value": 24.0 },
              { "custom_field_definition_id": 378436, "value": 34 },
              { "custom_field_definition_id": 378437, "value": "asdf" },
              { "custom_field_definition_id": 378438, "value": "www.urjanet.com" }
            ],
            "interaction_count": 1,
            "date_created": 1577804582,
            "date_modified": 1577816006
          },
          {
            "id": 42412879,
            "name": "Dunder Mifflin (Sample - Try me!)",
            "address": {
              "street": "213 West Main Street",
              "city": "Scranton",
              "state": "PA",
              "postal_code": "18501",
              "country": null
            },
            "assignee_id": null,
            "contact_type_id": null,
            "details": "Overview: Official The Office merchandise available here! Show your Dunder Mifflin pride with various t-shirts and housewares including Pam's watercolor painting of Scranton's branch, Vance refrigeration swag and more., Shop by Theme: Dunder Mifflin\n\nApprox. Number of Employees: 5\n\n",
            "email_domain": "dundermifflin.com",
            "phone_numbers": [{ "number": "4153554776", "category": "work" }],
            "socials": [
              { "url": "https://twitter.com/dmsocialmedia", "category": "twitter" },
              {
                "url": "https://www.facebook.com/dundermifflinpaper",
                "category": "facebook"
              }
            ],
            "tags": ["sample"],
            "websites": [
              { "url": "http://www.dundermifflin.com/index.shtml", "category": "work" },
              { "url": "http://dundermifflin.com", "category": "work" }
            ],
            "custom_fields": [
              { "custom_field_definition_id": 378430, "value": true },
              { "custom_field_definition_id": 378431, "value": 12.0 },
              { "custom_field_definition_id": 378432, "value": 1575619200 },
              { "custom_field_definition_id": 378433, "value": 638296 },
              { "custom_field_definition_id": 378434, "value": [638300, 638301, 638303] },
              { "custom_field_definition_id": 378435, "value": 45.0 },
              { "custom_field_definition_id": 378436, "value": null },
              { "custom_field_definition_id": 378437, "value": "some textasdf" },
              { "custom_field_definition_id": 378438, "value": "www.urjanet.com" }
            ],
            "interaction_count": 1,
            "date_created": 1577804582,
            "date_modified": 1577806774
          },
          {
            "id": 42412880,
            "name": "Sabre Inc (Sample - Try me!)",
            "address": {
              "street": "543 Washington Ave",
              "city": "Philadelphia",
              "state": "PA",
              "postal_code": "19135",
              "country": null
            },
            "assignee_id": 811206,
            "contact_type_id": 1427440,
            "details": "some company",
            "email_domain": "sabre.com",
            "phone_numbers": [],
            "socials": [
              {
                "url": "https://www.linkedin.com/company/sabre-corporation",
                "category": "linkedin"
              },
              { "url": "https://twitter.com/sabre_corp", "category": "twitter" },
              {
                "url": "https://www.facebook.com/sabrecorporation",
                "category": "facebook"
              },
              { "url": "https://angel.co/sabre", "category": "other" },
              {
                "url": "http://www.crunchbase.com/organization/sabre-holdings",
                "category": "other"
              },
              {
                "url": "http://www.crunchbase.com/organization/sabre",
                "category": "other"
              },
              {
                "url": "https://www.owler.com/iaApp/205196/sabre-company-profile",
                "category": "other"
              }
            ],
            "tags": ["sample"],
            "websites": [{ "url": "https://www.sabre.com", "category": "work" }],
            "custom_fields": [
              { "custom_field_definition_id": 378431, "value": 68.0 },
              { "custom_field_definition_id": 378432, "value": 1577865600 },
              { "custom_field_definition_id": 378433, "value": 638298 },
              { "custom_field_definition_id": 378436, "value": null },
              { "custom_field_definition_id": 378438, "value": null },
              { "custom_field_definition_id": 378437, "value": null },
              { "custom_field_definition_id": 378435, "value": null },
              { "custom_field_definition_id": 378434, "value": [] },
              { "custom_field_definition_id": 378430, "value": false }
            ],
            "interaction_count": 0,
            "date_created": 1577804582,
            "date_modified": 1577816042
          }
        ]
      }
    },
    {
      "name": "coppercrm",
      "op": "getCustomFields",
      "localContext": expect.anything(),
      "result": {
        "status": 200,
        "body": [
          {
            "id": 378430,
            "name": "Checkbox",
            "data_type": "Checkbox",
            "available_on": ["person", "lead", "company", "opportunity"]
          },
          {
            "id": 378431,
            "name": "Currency Field",
            "data_type": "Currency",
            "available_on": ["person", "lead", "company", "opportunity"],
            "currency": "USD"
          },
          {
            "id": 378432,
            "name": "Date Field",
            "data_type": "Date",
            "available_on": ["person", "lead", "company", "opportunity"]
          },
          {
            "id": 378433,
            "name": "Dropdown Field",
            "data_type": "Dropdown",
            "available_on": ["opportunity", "person", "lead", "company"],
            "options": [
              { "id": 638296, "name": "Option 1", "rank": 0 },
              { "id": 638297, "name": "Option 2", "rank": 1 },
              { "id": 638298, "name": "Option 3", "rank": 2 }
            ]
          },
          {
            "id": 378434,
            "name": "Multi Select Dropdown Field",
            "data_type": "MultiSelect",
            "available_on": ["opportunity", "person", "lead", "company"],
            "options": [
              { "id": 638299, "name": "Option 1", "rank": 0 },
              { "id": 638300, "name": "Option 2", "rank": 1 },
              { "id": 638301, "name": "Option 3", "rank": 2 }
            ]
          },
          {
            "id": 378435,
            "name": "Number Field",
            "data_type": "Float",
            "available_on": ["opportunity", "person", "lead", "company"]
          },
          {
            "id": 378436,
            "name": "Percentage Field",
            "data_type": "Percentage",
            "available_on": ["opportunity", "person", "lead", "company"]
          },
          {
            "id": 378437,
            "name": "Text Area Field",
            "data_type": "Text",
            "available_on": ["opportunity", "person", "lead", "company"]
          },
          {
            "id": 378438,
            "name": "Url Field",
            "data_type": "URL",
            "available_on": ["person", "lead", "company", "opportunity"]
          },
          {
            "id": 378443,
            "name": "New Text Area",
            "data_type": "Text",
            "available_on": ["lead"]
          },
          {
            "id": 378445,
            "name": "New Text Area2",
            "data_type": "Text",
            "available_on": ["lead"]
          }
        ]
      }
    },
    {
      "name": "coppercrm",
      "op": "getCustomFields",
      "localContext": expect.anything(),
      "result": {
        "status": 200,
        "body": [
          {
            "id": 378430,
            "name": "Checkbox",
            "data_type": "Checkbox",
            "available_on": ["person", "lead", "company", "opportunity"]
          },
          {
            "id": 378431,
            "name": "Currency Field",
            "data_type": "Currency",
            "available_on": ["person", "lead", "company", "opportunity"],
            "currency": "USD"
          },
          {
            "id": 378432,
            "name": "Date Field",
            "data_type": "Date",
            "available_on": ["person", "lead", "company", "opportunity"]
          },
          {
            "id": 378433,
            "name": "Dropdown Field",
            "data_type": "Dropdown",
            "available_on": ["opportunity", "person", "lead", "company"],
            "options": [
              { "id": 638296, "name": "Option 1", "rank": 0 },
              { "id": 638297, "name": "Option 2", "rank": 1 },
              { "id": 638298, "name": "Option 3", "rank": 2 }
            ]
          },
          {
            "id": 378434,
            "name": "Multi Select Dropdown Field",
            "data_type": "MultiSelect",
            "available_on": ["opportunity", "person", "lead", "company"],
            "options": [
              { "id": 638299, "name": "Option 1", "rank": 0 },
              { "id": 638300, "name": "Option 2", "rank": 1 },
              { "id": 638301, "name": "Option 3", "rank": 2 },
              { "id": 638302, "name": "New Option", "rank": 3 },
              { "id": 638303, "name": "Newest Option", "rank": 4 }
            ]
          },
          {
            "id": 378435,
            "name": "Number Field",
            "data_type": "Float",
            "available_on": ["opportunity", "person", "lead", "company"]
          },
          {
            "id": 378436,
            "name": "Percentage Field",
            "data_type": "Percentage",
            "available_on": ["opportunity", "person", "lead", "company"]
          },
          {
            "id": 378437,
            "name": "Text Area Field",
            "data_type": "Text",
            "available_on": ["opportunity", "person", "lead", "company"]
          },
          {
            "id": 378438,
            "name": "Url Field",
            "data_type": "URL",
            "available_on": ["person", "lead", "company", "opportunity"]
          },
          {
            "id": 378443,
            "name": "New Text Area",
            "data_type": "Text",
            "available_on": ["lead"]
          },
          {
            "id": 378445,
            "name": "New Text Area2",
            "data_type": "Text",
            "available_on": ["lead"]
          }
        ]
      }
    },
    {
      "name": "coppercrm",
      "op": "getContactTypes",
      "localContext": expect.anything(),
      "result": {
        "status": 200,
        "text": "[{\"id\":1427439,\"name\":\"Potential Customer\"},{\"id\":1427440,\"name\":\"Current Customer\"},{\"id\":1427441,\"name\":\"Uncategorized\"},{\"id\":1427442,\"name\":\"Other\"}]"
      }
    },
    {
      "name": "coppercrm",
      "op": "getUsers",
      "localContext": expect.anything(),
      "result": {
        "status": 200,
        "text": "[{\"id\":811206,\"name\":\"Tim Liu\",\"email\":\"timliuhull3@gmail.com\"}]"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asAccount",
      "input": {
        "attributes": {
          "coppercrm/name": {
            "operation": "setIfNull",
            "value": "Copper"
          },
          "coppercrm/street": {
            "operation": "set",
            "value": "301 Howard Street"
          },
          "coppercrm/city": {
            "operation": "set",
            "value": "San Francisco"
          },
          "coppercrm/state": {
            "operation": "set",
            "value": "CA"
          },
          "coppercrm/country": {
            "operation": "set",
            "value": null
          },
          "coppercrm/assigneeid": {
            "operation": "set",
            "value": 811206
          },
          "coppercrm/owneremail": {
            "operation": "set",
            "value": "timliuhull3@gmail.com"
          },
          "coppercrm/contacttypeid": {
            "operation": "set",
            "value": 1427442
          },
          "coppercrm/contacttypename": {
            "operation": "set",
            "value": "Other"
          },
          "coppercrm/details": {
            "operation": "set",
            "value": "A crm that works for you, so you can spend time on relationships instead of data."
          },
          "coppercrm/emaildomain": {
            "operation": "set",
            "value": "copper.com"
          },
          "coppercrm/numbers": {
            "operation": "set",
            "value": [
              {
                "number": "4153554776",
                "category": "work"
              }
            ]
          },
          "coppercrm/socials": {
            "operation": "set",
            "value": []
          },
          "coppercrm/tags": {
            "operation": "set",
            "value": ["sample"]
          },
          "coppercrm/websitesjson": {
            "operation": "set",
            "value": [
              {
                "url": "www.copper.com",
                "category": "work"
              }
            ]
          },
          "coppercrm/interactioncount": {
            "operation": "set",
            "value": 1
          },
          "coppercrm/created": {
            "operation": "set",
            "value": 1577804582
          },
          "coppercrm/modified_at": {
            "operation": "set",
            "value": 1577816006
          },
          "coppercrm/checkbox": {
            "operation": "set",
            "value": true
          },
          "coppercrm/currency": {
            "operation": "set",
            "value": 34
          },
          "coppercrm/date": {
            "operation": "set",
            "value": 1575705600
          },
          "coppercrm/dropdownfield": {
            "operation": "set",
            "value": "Option 1"
          },
          "coppercrm/multifield": {
            "operation": "set",
            "value": ["Option 1", "Option 2"]
          },
          "coppercrm/numberfield": {
            "operation": "set",
            "value": 24
          },
          "coppercrm/percentagefield": {
            "operation": "set",
            "value": 34
          },
          "coppercrm/areafield": {
            "operation": "set",
            "value": "asdf"
          },
          "coppercrm/urlfield": {
            "operation": "set",
            "value": "www.urjanet.com"
          },
          "coppercrm/id": {
            "operation": "set",
            "value": 42412878
          }
        },
        "ident": {
          "domain": "copper.com",
          "anonymous_id": "coppercrm:42412878"
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asAccount",
      "input": {
        "attributes": {
          "coppercrm/name": {
            "operation": "setIfNull",
            "value": "Dunder Mifflin (Sample - Try me!)"
          },
          "coppercrm/street": {
            "operation": "set",
            "value": "213 West Main Street"
          },
          "coppercrm/city": {
            "operation": "set",
            "value": "Scranton"
          },
          "coppercrm/state": {
            "operation": "set",
            "value": "PA"
          },
          "coppercrm/country": {
            "operation": "set",
            "value": null
          },
          "coppercrm/assigneeid": {
            "operation": "set",
            "value": null
          },
          "coppercrm/owneremail": {
            "operation": "set",
            "value": null
          },
          "coppercrm/contacttypeid": {
            "operation": "set",
            "value": null
          },
          "coppercrm/contacttypename": {
            "operation": "set",
            "value": null
          },
          "coppercrm/details": {
            "operation": "set",
            "value": "Overview: Official The Office merchandise available here! Show your Dunder Mifflin pride with various t-shirts and housewares including Pam's watercolor painting of Scranton's branch, Vance refrigeration swag and more., Shop by Theme: Dunder Mifflin\n\nApprox. Number of Employees: 5\n\n"
          },
          "coppercrm/emaildomain": {
            "operation": "set",
            "value": "dundermifflin.com"
          },
          "coppercrm/numbers": {
            "operation": "set",
            "value": [
              {
                "number": "4153554776",
                "category": "work"
              }
            ]
          },
          "coppercrm/socials": {
            "operation": "set",
            "value": [
              {
                "url": "https://twitter.com/dmsocialmedia",
                "category": "twitter"
              },
              {
                "url": "https://www.facebook.com/dundermifflinpaper",
                "category": "facebook"
              }
            ]
          },
          "coppercrm/tags": {
            "operation": "set",
            "value": ["sample"]
          },
          "coppercrm/websitesjson": {
            "operation": "set",
            "value": [
              {
                "url": "http://www.dundermifflin.com/index.shtml",
                "category": "work"
              },
              {
                "url": "http://dundermifflin.com",
                "category": "work"
              }
            ]
          },
          "coppercrm/interactioncount": {
            "operation": "set",
            "value": 1
          },
          "coppercrm/created": {
            "operation": "set",
            "value": 1577804582
          },
          "coppercrm/modified_at": {
            "operation": "set",
            "value": 1577806774
          },
          "coppercrm/checkbox": {
            "operation": "set",
            "value": true
          },
          "coppercrm/currency": {
            "operation": "set",
            "value": 12
          },
          "coppercrm/date": {
            "operation": "set",
            "value": 1575619200
          },
          "coppercrm/dropdownfield": {
            "operation": "set",
            "value": "Option 1"
          },
          "coppercrm/multifield": {
            "operation": "set",
            "value": ["Option 2", "Option 3", "Newest Option"]
          },
          "coppercrm/numberfield": {
            "operation": "set",
            "value": 45
          },
          "coppercrm/percentagefield": {
            "operation": "set",
            "value": null
          },
          "coppercrm/areafield": {
            "operation": "set",
            "value": "some textasdf"
          },
          "coppercrm/urlfield": {
            "operation": "set",
            "value": "www.urjanet.com"
          },
          "coppercrm/id": {
            "operation": "set",
            "value": 42412879
          }
        },
        "ident": {
          "domain": "dundermifflin.com",
          "anonymous_id": "coppercrm:42412879"
        }
      },
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asAccount",
      "input": {
        "attributes": {
          "coppercrm/name": {
            "operation": "setIfNull",
            "value": "Sabre Inc (Sample - Try me!)"
          },
          "coppercrm/street": {
            "operation": "set",
            "value": "543 Washington Ave"
          },
          "coppercrm/city": {
            "operation": "set",
            "value": "Philadelphia"
          },
          "coppercrm/state": {
            "operation": "set",
            "value": "PA"
          },
          "coppercrm/country": {
            "operation": "set",
            "value": null
          },
          "coppercrm/assigneeid": {
            "operation": "set",
            "value": 811206
          },
          "coppercrm/owneremail": {
            "operation": "set",
            "value": "timliuhull3@gmail.com"
          },
          "coppercrm/contacttypeid": {
            "operation": "set",
            "value": 1427440
          },
          "coppercrm/contacttypename": {
            "operation": "set",
            "value": "Current Customer"
          },
          "coppercrm/details": {
            "operation": "set",
            "value": "some company"
          },
          "coppercrm/emaildomain": {
            "operation": "set",
            "value": "sabre.com"
          },
          "coppercrm/numbers": {
            "operation": "set",
            "value": []
          },
          "coppercrm/socials": {
            "operation": "set",
            "value": [
              {
                "url": "https://www.linkedin.com/company/sabre-corporation",
                "category": "linkedin"
              },
              {
                "url": "https://twitter.com/sabre_corp",
                "category": "twitter"
              },
              {
                "url": "https://www.facebook.com/sabrecorporation",
                "category": "facebook"
              },
              {
                "url": "https://angel.co/sabre",
                "category": "other"
              },
              {
                "url": "http://www.crunchbase.com/organization/sabre-holdings",
                "category": "other"
              },
              {
                "url": "http://www.crunchbase.com/organization/sabre",
                "category": "other"
              },
              {
                "url": "https://www.owler.com/iaApp/205196/sabre-company-profile",
                "category": "other"
              }
            ]
          },
          "coppercrm/tags": {
            "operation": "set",
            "value": ["sample"]
          },
          "coppercrm/websitesjson": {
            "operation": "set",
            "value": [
              {
                "url": "https://www.sabre.com",
                "category": "work"
              }
            ]
          },
          "coppercrm/interactioncount": {
            "operation": "set",
            "value": 0
          },
          "coppercrm/created": {
            "operation": "set",
            "value": 1577804582
          },
          "coppercrm/modified_at": {
            "operation": "set",
            "value": 1577816042
          },
          "coppercrm/checkbox": {
            "operation": "set",
            "value": false
          },
          "coppercrm/currency": {
            "operation": "set",
            "value": 68
          },
          "coppercrm/date": {
            "operation": "set",
            "value": 1577865600
          },
          "coppercrm/dropdownfield": {
            "operation": "set",
            "value": "Option 3"
          },
          "coppercrm/numberfield": {
            "operation": "set",
            "value": null
          },
          "coppercrm/percentagefield": {
            "operation": "set",
            "value": null
          },
          "coppercrm/areafield": {
            "operation": "set",
            "value": null
          },
          "coppercrm/urlfield": {
            "operation": "set",
            "value": null
          },
          "coppercrm/id": {
            "operation": "set",
            "value": 42412880
          }
        },
        "ident": {
          "domain": "sabre.com",
          "anonymous_id": "coppercrm:42412880"
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
};

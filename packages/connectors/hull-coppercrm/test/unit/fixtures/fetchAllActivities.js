module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
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
      "activities_to_fetch": [
        "0",
        "908224",
        "908223",
        "908222"
      ],
      "coppercrm_api_key": "b55294da6b51260590a4547aeb0838b9",
      "coppercrm_email": "timliuhull3@gmail.com",
      "deleteLeadWebhookId": 113358,
      "deletePersonWebhookId": 113359,
      "deleteCompanyWebhookId": 113360,
      "deleteOpportunityWebhookId": 113361,
      "last_fetchRecentActivities": 1577997448,
      "last_fetchRecentCompanies": 1577997450,
      "last_fetchRecentPeople": 1577997449,
      "last_fetchRecentLeads": 1577997001,
      "last_fetchRecentOpportunities": 1577997451
    }
  },
  "route": "fetchAllActivities",
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
      "op": "fetchAllActivities",
      "input": {
        "activity_types": expect.arrayContaining([
          {
            "id": 0,
            "category": "user"
          },
          {
            "id": 908224,
            "category": "user"
          },
          {
            "id": 908223,
            "category": "user"
          },
          {
            "id": 908222,
            "category": "user"
          }
        ])
      },
      "result": {
        "status": 200,
        "text": "[{\"id\":6336813267,\"parent\":{\"id\":94693339,\"type\":\"person\"},\"type\":{\"id\":908222,\"category\":\"user\"},\"user_id\":811206,\"details\":\"called jon last year\",\"activity_date\":1572813420,\"old_value\":null,\"new_value\":null,\"date_created\":1577997448,\"date_modified\":1572813420},{\"id\":6336780524,\"parent\":{\"id\":50842537,\"type\":\"lead\"},\"type\":{\"id\":908222,\"category\":\"user\"},\"user_id\":811206,\"details\":\"Called him during turkey3 won\\u0026#x27;t edit modified\",\"activity_date\":1574368140,\"old_value\":null,\"new_value\":null,\"date_created\":1577997000,\"date_modified\":1574368140},{\"id\":6333033261,\"parent\":{\"id\":19438259,\"type\":\"opportunity\"},\"type\":{\"id\":0,\"category\":\"user\"},\"user_id\":811206,\"details\":\"note to see office chairs\",\"activity_date\":1576078740,\"old_value\":null,\"new_value\":null,\"date_created\":1577806795,\"date_modified\":1576078740},{\"id\":6333031829,\"parent\":{\"id\":42412879,\"type\":\"company\"},\"type\":{\"id\":908222,\"category\":\"user\"},\"user_id\":811206,\"details\":\"called michael!\",\"activity_date\":1576165140,\"old_value\":null,\"new_value\":null,\"date_created\":1577806751,\"date_modified\":1576165140},{\"id\":6333030590,\"parent\":{\"id\":94693342,\"type\":\"person\"},\"type\":{\"id\":908222,\"category\":\"user\"},\"user_id\":811206,\"details\":\"Called brittnay\",\"activity_date\":1576683480,\"old_value\":null,\"new_value\":null,\"date_created\":1577806706,\"date_modified\":1576683480},{\"id\":6336757725,\"parent\":{\"id\":50842537,\"type\":\"lead\"},\"type\":{\"id\":908222,\"category\":\"user\"},\"user_id\":811206,\"details\":\"called him a week ago\",\"activity_date\":1577651040,\"old_value\":null,\"new_value\":null,\"date_created\":1577996654,\"date_modified\":1577651040},{\"id\":6333016749,\"parent\":{\"id\":50818679,\"type\":\"lead\"},\"type\":{\"id\":908222,\"category\":\"user\"},\"user_id\":811206,\"details\":\"Called someone\",\"activity_date\":1577806209,\"old_value\":null,\"new_value\":null,\"date_created\":1577806212,\"date_modified\":1577806209},{\"id\":6333539372,\"parent\":{\"id\":19438261,\"type\":\"opportunity\"},\"type\":{\"id\":0,\"category\":\"user\"},\"user_id\":811206,\"details\":\"Some additional notes\",\"activity_date\":1577822084,\"old_value\":null,\"new_value\":null,\"date_created\":1577822084,\"date_modified\":1577822084},{\"id\":6336644555,\"parent\":{\"id\":94693342,\"type\":\"person\"},\"type\":{\"id\":0,\"category\":\"user\"},\"user_id\":811206,\"details\":\"not to call brittany\",\"activity_date\":1577995226,\"old_value\":null,\"new_value\":null,\"date_created\":1577995230,\"date_modified\":1577995226},{\"id\":6336756720,\"parent\":{\"id\":50842537,\"type\":\"lead\"},\"type\":{\"id\":0,\"category\":\"user\"},\"user_id\":811206,\"details\":\"please call this guy\",\"activity_date\":1577996580,\"old_value\":null,\"new_value\":null,\"date_created\":1577996638,\"date_modified\":1577996580}]"
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
      "op": "getActivityTypes",
      "result": {
        "status": 200,
        "text": "{\"user\":[{\"id\":0,\"category\":\"user\",\"name\":\"Note\",\"is_disabled\":false,\"count_as_interaction\":false},{\"id\":908224,\"category\":\"user\",\"name\":\"To Do\",\"is_disabled\":true,\"count_as_interaction\":false},{\"id\":908223,\"category\":\"user\",\"name\":\"Meeting\",\"is_disabled\":false,\"count_as_interaction\":true},{\"id\":908222,\"category\":\"user\",\"name\":\"Phone Call\",\"is_disabled\":false,\"count_as_interaction\":true}],\"system\":[{\"id\":1,\"category\":\"system\",\"name\":\"Property Changed\",\"is_disabled\":false,\"count_as_interaction\":false},{\"id\":2,\"category\":\"system\",\"name\":\"User Assigned\",\"is_disabled\":false,\"count_as_interaction\":false},{\"id\":3,\"category\":\"system\",\"name\":\"Pipeline Stage Changed\",\"is_disabled\":false,\"count_as_interaction\":false},{\"id\":8,\"category\":\"system\",\"name\":\"Entity Created\",\"is_disabled\":false,\"count_as_interaction\":false},{\"id\":12,\"category\":\"system\",\"name\":\"User Joined\",\"is_disabled\":false,\"count_as_interaction\":false},{\"id\":6,\"category\":\"system\",\"name\":\"Email\",\"is_disabled\":false,\"count_as_interaction\":true}]}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm-person:person-94693339"
        },
        "events": [
          {
            "context": {
              "created_at": "2019-11-03T20:37:00.000Z",
              "event_id": 6336813267
            },
            "properties": {
              "created_at": "2019-11-03T20:37:00.000Z",
              "details": "called jon last year",
              "copper_activity_id": 6336813267,
              "assigneeEmail": "timliuhull3@gmail.com"
            },
            "eventName": "Phone Call"
          }
        ]
      },
      "result": [
        {}
      ]
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm-lead:lead-50842537"
        },
        "events": [
          {
            "context": {
              "created_at": "2019-11-21T20:29:00.000Z",
              "event_id": 6336780524
            },
            "properties": {
              "created_at": "2019-11-21T20:29:00.000Z",
              "details": "Called him during turkey3 won&#x27;t edit modified",
              "copper_activity_id": 6336780524,
              "assigneeEmail": "timliuhull3@gmail.com"
            },
            "eventName": "Phone Call"
          }
        ]
      },
      "result": [
        {}
      ]
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm-person:person-94693342"
        },
        "events": [
          {
            "context": {
              "created_at": "2019-12-18T15:38:00.000Z",
              "event_id": 6333030590
            },
            "properties": {
              "created_at": "2019-12-18T15:38:00.000Z",
              "details": "Called brittnay",
              "copper_activity_id": 6333030590,
              "assigneeEmail": "timliuhull3@gmail.com"
            },
            "eventName": "Phone Call"
          }
        ]
      },
      "result": [
        {}
      ]
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm-lead:lead-50842537"
        },
        "events": [
          {
            "context": {
              "created_at": "2019-12-29T20:24:00.000Z",
              "event_id": 6336757725
            },
            "properties": {
              "created_at": "2019-12-29T20:24:00.000Z",
              "details": "called him a week ago",
              "copper_activity_id": 6336757725,
              "assigneeEmail": "timliuhull3@gmail.com"
            },
            "eventName": "Phone Call"
          }
        ]
      },
      "result": [
        {}
      ]
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm-lead:lead-50818679"
        },
        "events": [
          {
            "context": {
              "created_at": "2019-12-31T15:30:09.000Z",
              "event_id": 6333016749
            },
            "properties": {
              "created_at": "2019-12-31T15:30:09.000Z",
              "details": "Called someone",
              "copper_activity_id": 6333016749,
              "assigneeEmail": "timliuhull3@gmail.com"
            },
            "eventName": "Phone Call"
          }
        ]
      },
      "result": [
        {}
      ]
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm-person:person-94693342"
        },
        "events": [
          {
            "context": {
              "created_at": "2020-01-02T20:00:26.000Z",
              "event_id": 6336644555
            },
            "properties": {
              "created_at": "2020-01-02T20:00:26.000Z",
              "copper_activity_id": 6336644555,
              "details": "not to call brittany",
              "assigneeEmail": "timliuhull3@gmail.com"
            },
            "eventName": "Note"
          }
        ]
      },
      "result": [
        {}
      ]
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "coppercrm-lead:lead-50842537"
        },
        "events": [
          {
            "context": {
              "created_at": "2020-01-02T20:23:00.000Z",
              "event_id": 6336756720
            },
            "properties": {
              "created_at": "2020-01-02T20:23:00.000Z",
              "copper_activity_id": 6336756720,
              "details": "please call this guy",
              "assigneeEmail": "timliuhull3@gmail.com"
            },
            "eventName": "Note"
          }
        ]
      },
      "result": [
        {}
      ]
    }
  ],
  "result": expect.anything()
}

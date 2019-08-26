module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
      "user_claims": [
        {
          "service": "email",
          "hull": "email"
        }
      ],
      "synchronized_user_segments": [
        "5d03f0d5ef68e25a1100beab"
      ],
      "marketo_client_id": "marketoclientid",
      "marketo_client_secret": "marketosecret",
      "marketo_authorized_user": "user@company.com",
      "marketo_identity_url": "https://1234.mktorest.com/identity",
      "pollLeadExportInterval": null,
      "access_token": "access_token",
      "expires_in": 3432,
      "scope": "user@company.com",
      "incoming_user_attributes": [
        {
          "hull": "marketo/companyname",
          "service": "company"
        },
        {
          "hull": "marketo/firstname",
          "service": "firstName"
        },
        {
          "hull": "marketo/lastname",
          "service": "lastName"
        },
        {
          "hull": "marketo/companyname",
          "service": "company"
        },
        {
          "hull": "marketo/site",
          "service": "site"
        },
        {
          "hull": "marketo/billingaddress",
          "service": "billingStreet"
        },
        {
          "hull": "marketo/billingcity",
          "service": "billingCity"
        },
        {
          "hull": "marketo/billingstate",
          "service": "billingState"
        },
        {
          "hull": "marketo/billingcountry",
          "service": "billingCountry"
        },
        {
          "hull": "marketo/billingpostalcode",
          "service": "billingPostalCode"
        }
      ],
      "latestLeadSync": 1565127843849,
      "fetch_all_attributes": true,
      "flow_control_user_update_success_size": "100"
    }
  },
  "route": "fetchRecentLeadActivity",
  "input": {},
  "serviceRequests": [
    {
      "localContext": [
        {
          "marketoApiUrl": "https://1234.mktorest.com",
          "latestLeadSyncMillis": 1565127843849,
          "latestLeadSync": expect.anything(),
          "now": expect.anything(),
          "latestLeadSyncFormatted": "2019-08-06T17:44:03-04:00"
        }
      ],
      "name": "marketo",
      "op": "getLatestLeadActivityPagingToken",
      "result": {
        "status": 200,
        "text": "{\"requestId\":\"5f6f#16cbb188850\",\"success\":true,\"nextPageToken\":\"nextPageToken1\"}"
      }
    },
    {
      "localContext": [
        {
          "hull-internal-cacheWrappedValue": undefined,
          "marketoApiUrl": "https://1234.mktorest.com",
          "latestLeadSyncMillis": 1565127843849,
          "latestLeadSync": expect.anything(),
          "now": expect.anything(),
          "latestLeadSyncFormatted": "2019-08-06T17:44:03-04:00",
          "nextPageToken": "nextPageToken1",
          "fields": [
            "company",
            "firstName",
            "lastName",
            "company",
            "site",
            "billingStreet",
            "billingCity",
            "billingState",
            "billingCountry",
            "billingPostalCode"
          ]
        }
      ],
      "name": "marketo",
      "op": "getActivityTypeEnum",
      "result": {
        "status": 200,
        "text": "{\"requestId\":\"1ee#16cbb188bc8\",\"result\":[{\"id\":1,\"name\":\"Visit Webpage\",\"description\":\"User visits a web page\",\"primaryAttribute\":{\"name\":\"Webpage ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Client IP Address\",\"dataType\":\"string\"},{\"name\":\"Personalized URL\",\"dataType\":\"boolean\"},{\"name\":\"Query Parameters\",\"dataType\":\"string\"},{\"name\":\"Referrer URL\",\"dataType\":\"string\"},{\"name\":\"Search Engine\",\"dataType\":\"string\"},{\"name\":\"Search Query\",\"dataType\":\"string\"},{\"name\":\"User Agent\",\"dataType\":\"string\"},{\"name\":\"Webpage URL\",\"dataType\":\"string\"}]},{\"id\":2,\"name\":\"Fill Out Form\",\"description\":\"User fills out and submits a form on web page\",\"primaryAttribute\":{\"name\":\"Webform ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Client IP Address\",\"dataType\":\"string\"},{\"name\":\"Form Fields\",\"dataType\":\"text\"},{\"name\":\"Query Parameters\",\"dataType\":\"string\"},{\"name\":\"Referrer URL\",\"dataType\":\"string\"},{\"name\":\"User Agent\",\"dataType\":\"string\"},{\"name\":\"Webpage ID\",\"dataType\":\"integer\"}]},{\"id\":3,\"name\":\"Click Link\",\"description\":\"User clicks link on a page\",\"primaryAttribute\":{\"name\":\"Link ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Client IP Address\",\"dataType\":\"string\"},{\"name\":\"Query Parameters\",\"dataType\":\"string\"},{\"name\":\"Referrer URL\",\"dataType\":\"string\"},{\"name\":\"User Agent\",\"dataType\":\"string\"},{\"name\":\"Webpage ID\",\"dataType\":\"integer\"}]},{\"id\":6,\"name\":\"Send Email\",\"description\":\"Send Marketo Email to a person\",\"primaryAttribute\":{\"name\":\"Mailing ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Campaign Run ID\",\"dataType\":\"integer\"},{\"name\":\"Choice Number\",\"dataType\":\"integer\"},{\"name\":\"Has Predictive\",\"dataType\":\"boolean\"},{\"name\":\"Step ID\",\"dataType\":\"integer\"},{\"name\":\"Test Variant\",\"dataType\":\"integer\"}]},{\"id\":7,\"name\":\"Email Delivered\",\"description\":\"Marketo Email is delivered to a lead/contact\",\"primaryAttribute\":{\"name\":\"Mailing ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Campaign Run ID\",\"dataType\":\"integer\"},{\"name\":\"Choice Number\",\"dataType\":\"integer\"},{\"name\":\"Has Predictive\",\"dataType\":\"boolean\"},{\"name\":\"Step ID\",\"dataType\":\"integer\"},{\"name\":\"Test Variant\",\"dataType\":\"integer\"}]},{\"id\":8,\"name\":\"Email Bounced\",\"description\":\"Marketo Email is bounced for a lead\",\"primaryAttribute\":{\"name\":\"Mailing ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Campaign Run ID\",\"dataType\":\"integer\"},{\"name\":\"Category\",\"dataType\":\"string\"},{\"name\":\"Choice Number\",\"dataType\":\"integer\"},{\"name\":\"Details\",\"dataType\":\"string\"},{\"name\":\"Email\",\"dataType\":\"string\"},{\"name\":\"Has Predictive\",\"dataType\":\"boolean\"},{\"name\":\"Step ID\",\"dataType\":\"integer\"},{\"name\":\"Subcategory\",\"dataType\":\"string\"},{\"name\":\"Test Variant\",\"dataType\":\"integer\"}]},{\"id\":9,\"name\":\"Unsubscribe Email\",\"description\":\"Person unsubscribed from Marketo Emails\",\"primaryAttribute\":{\"name\":\"Mailing ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Campaign Run ID\",\"dataType\":\"integer\"},{\"name\":\"Client IP Address\",\"dataType\":\"string\"},{\"name\":\"Form Fields\",\"dataType\":\"text\"},{\"name\":\"Has Predictive\",\"dataType\":\"boolean\"},{\"name\":\"Query Parameters\",\"dataType\":\"string\"},{\"name\":\"Referrer URL\",\"dataType\":\"string\"},{\"name\":\"Test Variant\",\"dataType\":\"integer\"},{\"name\":\"User Agent\",\"dataType\":\"string\"},{\"name\":\"Webform ID\",\"dataType\":\"integer\"},{\"name\":\"Webpage ID\",\"dataType\":\"integer\"}]},{\"id\":10,\"name\":\"Open Email\",\"description\":\"User opens Marketo Email\",\"primaryAttribute\":{\"name\":\"Mailing ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Campaign Run ID\",\"dataType\":\"integer\"},{\"name\":\"Choice Number\",\"dataType\":\"integer\"},{\"name\":\"Device\",\"dataType\":\"string\"},{\"name\":\"Has Predictive\",\"dataType\":\"boolean\"},{\"name\":\"Is Mobile Device\",\"dataType\":\"boolean\"},{\"name\":\"Platform\",\"dataType\":\"string\"},{\"name\":\"Step ID\",\"dataType\":\"integer\"},{\"name\":\"Test Variant\",\"dataType\":\"integer\"},{\"name\":\"User Agent\",\"dataType\":\"string\"}]},{\"id\":11,\"name\":\"Click Email\",\"description\":\"User clicks on a link in a Marketo Email\",\"primaryAttribute\":{\"name\":\"Mailing ID\",\"dataType\":\"integer\"},\"attributes\":[{\"name\":\"Campaign Run ID\",\"dataType\":\"integer\"},{\"name\":\"Choice Number\",\"dataType\":\"integer\"},{\"name\":\"Device\",\"dataType\":\"string\"},{\"name\":\"Is Mobile Device\",\"dataType\":\"boolean\"},{\"name\":\"Is Predictive\",\"dataType\":\"boolean\"},{\"name\":\"Link\",\"dataType\":\"string\"},{\"name\":\"Link ID\",\"dataType\":\"string\"},{\"name\":\"Platform\",\"dataType\":\"string\"},{\"name\":\"Step ID\",\"dataType\":\"integer\"},{\"name\":\"Test Variant\",\"dataType\":\"integer\"},{\"name\":\"User Agent\",\"dataType\":\"string\"}]},{\"id\":12,\"name\":\"New Lead\",\"description\":\"New person/record is added to the lead database\",\"attributes\":[{\"name\":\"Created Date\",\"dataType\":\"date\"},{\"name\":\"Form Name\",\"dataType\":\"string\"},{\"name\":\"Lead Source\",\"dataType\":\"string\"},{\"name\":\"List Name\",\"dataType\":\"string\"},{\"name\":\"SFDC Type\",\"dataType\":\"string\"},{\"name\":\"Source Type\",\"dataType\":\"string\"},{\"name\":\"API Method Name\",\"dataType\":\"string\"},{\"name\":\"Modifying User\",\"dataType\":\"string\"},{\"name\":\"Request Id\",\"dataType\":\"string\"}]}],\"success\":true}"
      }
    },
    {
      "localContext": [
        {
          "marketoApiUrl": "https://1234.mktorest.com",
          "latestLeadSyncMillis": 1565127843849,
          "latestLeadSync": expect.anything(),
          "now": expect.anything(),
          "latestLeadSyncFormatted": "2019-08-06T17:44:03-04:00",
          "nextPageToken": "nextPageToken1",
          "fields": [
            "company",
            "firstName",
            "lastName",
            "company",
            "site",
            "billingStreet",
            "billingCity",
            "billingState",
            "billingCountry",
            "billingPostalCode"
          ],
          "hull-internal-cacheWrappedValue": undefined,
          "activityTypeIdMap": expect.anything(),
          "service_name": "marketo"
        }
      ],
      "name": "marketo",
      "op": "getLatestLeadActivity",
      "result": {
        "status": 200,
        "text": "{\"requestId\":\"9993#16cbb188e75\",\"result\":[{\"id\":567890123,\"marketoGUID\":\"567890123\",\"leadId\":12345678,\"activityDate\":\"2019-08-22T18:20:08Z\",\"activityTypeId\":12,\"fields\":[],\"attributes\":[{\"name\":\"Created Date\",\"value\":\"2019-08-22\"},{\"name\":\"Source Type\",\"value\":\"Web service API\"},{\"name\":\"api method name\",\"value\":\"syncLead\"},{\"name\":\"modifying user\",\"value\":\"someuser@somecompany.com\"},{\"name\":\"request id\",\"value\":\"16b#16cba8ea16a\"}]}],\"success\":true,\"nextPageToken\":\"nextPageToken\",\"moreResult\":false}"
      }
    },
    {
      "localContext": [
        {
          "marketoApiUrl": "https://1234.mktorest.com",
          "latestLeadSyncMillis": 1565127843849,
          "latestLeadSync": expect.anything(),
          "now": expect.anything(),
          "latestLeadSyncFormatted": "2019-08-06T17:44:03-04:00",
          "nextPageToken": "nextPageToken1",
          "hull-internal-cacheWrappedValue": undefined,
          "fields": [
            "company",
            "firstName",
            "lastName",
            "company",
            "site",
            "billingStreet",
            "billingCity",
            "billingState",
            "billingCountry",
            "billingPostalCode"
          ],
          "activityTypeIdMap": {
            "1": "Visit Webpage",
            "2": "Fill Out Form",
            "3": "Click Link",
            "6": "Send Email",
            "7": "Email Delivered",
            "8": "Email Bounced",
            "9": "Unsubscribe Email",
            "10": "Open Email",
            "11": "Click Email",
            "12": "New Lead"
          },
          "service_name": "marketo",
          "activityPage": {
            "requestId": "9993#16cbb188e75",
            "result": [
              {
                "id": 567890123,
                "marketoGUID": "567890123",
                "leadId": 12345678,
                "activityDate": "2019-08-22T18:20:08Z",
                "activityTypeId": 12,
                "fields": [],
                "attributes": [
                  {
                    "name": "Created Date",
                    "value": "2019-08-22"
                  },
                  {
                    "name": "Source Type",
                    "value": "Web service API"
                  },
                  {
                    "name": "api method name",
                    "value": "syncLead"
                  },
                  {
                    "name": "modifying user",
                    "value": "someuser@somecompany.com"
                  },
                  {
                    "name": "request id",
                    "value": "16b#16cba8ea16a"
                  }
                ]
              }
            ],
            "success": true,
            "nextPageToken": "nextPageToken",
            "moreResult": false
          }
        }
      ],
      "name": "hull",
      "op": "asUser",
      "input": {
        "attributes": {
          "marketo/id": {
            "value": 12345678,
            "operation": "set"
          }
        },
        "ident": {
          "anonymous_id": "marketo:12345678"
        },
        "events": [
          {
            "properties": {
              "Created Date": "2019-08-22",
              "Source Type": "Web service API",
              "api method name": "syncLead",
              "modifying user": "someuser@somecompany.com",
              "request id": "16b#16cba8ea16a"
            },
            "context": {
              "event_id": 567890123,
              "created_at": "2019-08-22T18:20:08Z"
            }
          }
        ]
      },
      result: {}
    },
    {
      "localContext": [
        {
          "marketoApiUrl": "https://1234.mktorest.com",
          "latestLeadSyncMillis": 1565127843849,
          "latestLeadSync": expect.anything(),
          "now": expect.anything(),
          "activityTypeIdMap": expect.anything(),
          "activityPage": expect.anything(),
          "fields": expect.anything(),
          "hull-internal-cacheWrappedValue": undefined,
          "latestLeadSyncFormatted": "2019-08-06T17:44:03-04:00",
          "nextPageToken": "nextPageToken1",
          "service_name": "marketo",
          "connector": {
            "private_settings": {
              "latestLeadSync": 1566506984233
            }
          }
        }
      ],
      "name": "hull",
      "op": "settingsUpdate",
      "input": {
        "latestLeadSync": 1566506984233
      },
      "result": {}
    }
  ],
  "result": expect.anything()
}

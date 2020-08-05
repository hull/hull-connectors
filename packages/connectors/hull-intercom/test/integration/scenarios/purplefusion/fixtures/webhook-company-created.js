module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      account_claims: [
        { "hull": "external_id", "service": "company_id", "required": false },
        { "hull": "domain", "service": "website", "required": false }
      ],
      incoming_account_attributes: [
        { hull: "intercom/tags", service: "tags", "overwrite": true },
        { hull: "intercom/segments", service: "segments", "overwrite": true },
        { hull: 'intercom/web_sessions', service: 'session_count', overwrite: true },
        { hull: 'intercom/website', service: 'website', overwrite: true },
        { hull: 'intercom/name', service: 'name', overwrite: true },
        { hull: 'intercom/monthly_spend', service: 'monthly_spend', overwrite: true },
        { hull: 'intercom/description', service: 'company_description', overwrite: true }
      ]
    }
  },
  "route": "webhooks",
  "input": {
    "type": "notification_event",
    "app_id": "lkqcyt9t",
    "data": {
      "type": "notification_event_data",
      "item": {
        "type": "company",
        "id": "5f2ab453471a3f50afb937f4",
        "company_id": "5f2ab453471a3f50afb937f5-qualification-company",
        "app_id": "lkqcyt9t",
        "name": "Rei",
        "plan_id": null,
        "remote_created_at": null,
        "created_at": "2020-08-05T13:29:55.588+00:00",
        "updated_at": "2020-08-05T13:29:55.588+00:00",
        "last_request_at": null,
        "monthly_spend": 0,
        "session_count": 0,
        "user_count": 0,
        "tag_ids": [],
        "custom_attributes": {}
      }
    },
    "links": {},
    "id": "notif_ac073374-3043-4b52-9d3f-f8201b1f53c1",
    "topic": "company.created",
    "delivery_status": "pending",
    "delivery_attempts": 1,
    "delivered_at": 0,
    "first_sent_at": 1596634195,
    "created_at": 1596634195,
    "self": null
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "intercom",
      "op": "getCompanySegments",
      "result": {
        "body": {
          "type": "list",
          "data": []
        }
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asAccount",
      "input": {
        "ident": {
          "anonymous_id": "intercom:5f2ab453471a3f50afb937f4",
          "external_id": "5f2ab453471a3f50afb937f5-qualification-company"
        },
        "attributes": {
          "intercom/id": {
            "operation": "set",
            "value": "5f2ab453471a3f50afb937f4",

          },
          "intercom/monthly_spend": {
            "operation": "set",
            "value": 0,

          },
          "intercom/name": {
            "operation": "set",
            "value": "Rei",
          },
          "intercom/web_sessions": {
            "operation": "set",
            "value": 0,
          },
          "intercom/segments": {
            "operation": "set",
            "value": [],
          },
          "name": {
            "operation": "setIfNull",
            "value": "Rei",
          },
        }
      },
      result: {}
    }
  ],
  "result": expect.anything()
}

module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "clientCredentialsEncryptedToken": "shhhclientCredentialsEncryptedToken",
    "private_settings": {
      "flow_control_user_update_success_size": "100",
      "activities_to_fetch": [],
      "deleteLeadWebhookId": 113358,
      "deletePersonWebhookId": 113359,
      "deleteCompanyWebhookId": 113360,
      "deleteOpportunityWebhookId": 113361,
      "coppercrm_api_key": "shhh",
      "lead_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      // not testing the synchronized lead segments right now, bypassing filters
      "synchronized_lead_segments": [],
      "outgoing_lead_attributes": [
        {
          hull: "email",
          service: "primaryEmail"
        },
        {
          hull: "test/test_name",
          service: "name"
        },
        {
          hull: "test/test_details",
          service: "details"
        },
        {
          hull: "test/customer_source_id",
          service: "customer_source_id"
        }
      ],
      "coppercrm_email": "timliuhull5@gmail.com",
      "flow_control_account_update_success_size": "100"
    }
  },
  "route": "leadUpdate",
  "input": {
    "data": [
      {
        "user": {
          "id": "5c54819ff441416d9c059af4",
          "email": "pepper@stark.com",
          "created_at": "2019-02-01T17:27:59Z",
          "test/test_name": "Pepper potts",
          "test/test_details": "Married to iron man",
          "test/customer_source_id": 1118256,
        },
        "account": {
          "id": "5c54819ef441416d9c059aed",
          "name": "Stark Industries",
          "updated_at": "2019-08-12T18:49:49Z",
          "created_at": "2019-02-01T17:27:58Z"
        }
      }
    ],
    "classType": {
      "service_name": "HullOutgoingUser",
      "name": "User"
    }
  },
  "serviceRequests": [
    {
      localContext: expect.anything(),
      name: "coppercrm",
      op: "upsertLead",
      input: {"properties":{"name":"Pepper potts","details":"Married to iron man","customer_source_id":1118256,"email": {"category": "other", "email": "pepper@stark.com"}},"match":{"field_name":"email","field_value":"pepper@stark.com"}},
      result: {
        status: 422,
      }
    }
  ],
  "result": expect.anything()
}

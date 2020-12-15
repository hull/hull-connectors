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
      "user_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      // not testing the synchronized lead segments right now, bypassing filters
      "synchronized_lead_segments": [],
      "incoming_person_attributes": [],
      "outgoing_user_attributes": [
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
  "route": "userUpdate",
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
          "coppercrm_person/id": 54459898
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
      op: "getCustomFields",
      result: {
        status: 200,
        body: []
      }
    },
    {
      localContext: expect.anything(),
      name: "coppercrm",
      op: "updatePerson",
      input: {"name":"Pepper potts","details":"Married to iron man","customer_source_id":1118256,"emails": [{"category": "other", "email": "pepper@stark.com"}]},
      result: {
        status: 200,
        body: {"id":54459898,"name":"Pepper potts","prefix":null,"first_name":"Pepper","last_name":"potts","middle_name":null,"suffix":null,"address":null,"assignee_id":null,"company_name":null,"customer_source_id":1118256,"details":"Married to iron man","emails":[{"category": "other", "email": "pepper@stark.com"}],"interaction_count":0,"monetary_unit":null,"monetary_value":null,"converted_unit":null,"converted_value":null,"socials":[],"status":"New","status_id":1161163,"tags":[],"title":null,"websites":[],"phone_numbers":[],"custom_fields":[],"date_created":1585778382,"date_modified":1585778382,"date_last_contacted":null,"converted_opportunity_id":null,"converted_at":null, "leads_converted_from": []}
      }
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "asUser",
      input: {"ident":{"anonymous_id":"coppercrm-person:person-54459898", "anonymous_ids": []},"attributes":{"coppercrm_person/id":{"value":54459898,"operation":"set"},"name":{"operation":"setIfNull","value":"Pepper potts"}}},
      result: {
        status: 200,
      }
    }
  ],
  "result": expect.anything()
}

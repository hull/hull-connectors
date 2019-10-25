module.exports = {
  "configuration": {
    "id": "5d51b4ebc07907e865025a7b",
    "secret": "shhhhhh",
    "organization": "organization.hullapp.io",
    "hostname": "225ddbbc.connector.io",
    "private_settings": {
      "webhook_id": 123,
      "user_claims": [
        {
          "hull": "email",
          "service": "emails"
        }
      ],
      "synchronized_user_segments": [],
      "account_claims": [
        {
          "hull": "domain",
          "service": "domain"
        }
      ],
      "link_users_in_hull": false,
      "synchronized_account_segments": [],
      "outgoing_account_attributes": [
        {
          "hull": "name",
          "service": "name"
        },
        {
          "hull": "closeio/description",
          "service": "description"
        }
      ],
      "link_users_in_service": true,
      "token_expires_in": 7199,
      "token_created_at": 1565635830,
      "refresh_token": "refresh_token",
      "access_token": "access_token",
      "incoming_user_attributes": [
        {
          "hull": "outreach/addressstreet",
          "service": "addressStreet"
        },
        {
          "hull": "outreach/custom1",
          "service": "custom1"
        }
      ],
      "outgoing_user_attributes": [
        {
          "hull": "closeio/title",
          "service": "title"
        }
      ],
      "incoming_account_attributes": [
        {
          "hull": "outreach/custom1",
          "service": "custom1"
        }
      ]
    }
  },
  "route": "webhooks",
  "input": {
    "classType": {
      "service_name": "outreach_incoming_webhook",
      "name": "Webhook"
    },
    "context": {},
    "data": {
      body: {
        "data": {
          "type": "prospect",
          "id": 184849,
          "attributes": {},
          "relationships": {}
        },
        "meta": {
          "deliveredAt": "2019-08-12T18:57:15.340+00:00",
          "eventName": "prospect.updated"
        }
      }
    }
  },
  "serviceRequests": [
    {
      "localContext": [
        {}
      ],
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "outreach:184849"
        },
        "attributes": {
          "outreach/id": {
            "value": 184849,
            "operation": "set"
          }
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
};


module.exports = {
  "configuration": {
    "id": "5d51b4ebc07907e865025a7b",
    "secret": "shhhhhh",
    "organization": "organization.hullapp.io",
    "hostname": "225ddbbc.connector.io",
    "private_settings": {
      "send_all_user_attributes": true,
      "send_all_account_attributes": true,
      "outgoing_account_attributes": [],
      "synchronized_user_segments": [],
      "synchronized_account_segments": [],
      "subscriptions": []
    },
  },
  "route": "create",
  "input": {
    "classType": {
      "service_name": "incoming_webpayload",
      "name": "WebPayload"
    },
    "context": {},
    "data": {
      "body": {
        "entityType": "user_event",
        "event_name": "Email Sent",
        "claims": {
          "email": "email_1@gmail.com"
        },
        "properties":
          {
            "sentBy": "bob@bob.com"
          }
      }
    },
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "email": "email_1@gmail.com"
        },
        "events": [
          {
            "eventName": "Email Sent",
            "properties": {
              "sentBy": "bob@bob.com"
            },
            "context": {
              "source": "zapier"
            }
          }
        ]
      },
      "result": {}
    }
  ],
  "result": expect.anything()
};


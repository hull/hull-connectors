
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
      "triggers": []
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
        "entityType": "user",
        "claims": {
          "email": "email_1@gmail.com"
        },
        "attributes":
          {
            "pipedrive/department": "marketing"
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
        "attributes": {
          "pipedrive/department": "marketing",
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
};


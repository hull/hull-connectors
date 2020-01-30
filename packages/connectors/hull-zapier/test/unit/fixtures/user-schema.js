
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
      "synchronized_events": [],
      "triggers": []
    },
  },
  "route": "schema",
  "input": {
    "classType": {
      "service_name": "incoming_webpayload",
      "name": "WebPayload"
    },
    "context": {},
    "data": {
      body: {
        "entityType": "user"
      }
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "getUserAttributes",
      "result": [
        {
          "key": "account.domain",
          "type": "string",
          "configurable": false,
          "visible": true,
          "track_changes": false
        },
        {
          "key": "account.salesforce/industry",
          "type": "string",
          "configurable": false,
          "visible": true,
          "track_changes": false
        },
        {
          "key": "traits_email",
          "type": "string",
          "visible": true,
          "track_changes": false,
          "app_updates": {},
          "updated_at": "2019-07-30T13:20:56Z",
          "created_at": "2019-07-30T13:20:56Z",
          "configurable": true
        },
        {
          "key": "traits_salesforce_contact/department",
          "type": "string",
          "visible": true,
          "track_changes": false,
          "app_updates": {},
          "updated_at": "2019-07-09T19:48:00Z",
          "created_at": "2019-07-09T19:48:00Z",
          "configurable": true
        }
      ]
    }
  ],
  "result": {
    "data": [
      {"name": "user.email"},
      {"name": "user.salesforce_contact/department"}
    ],
    "status": 200}
};


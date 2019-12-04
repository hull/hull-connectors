
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
        "entityType": "account"
      }
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "getAccountAttributes",
      "result": [
        {
          "key": "external_id",
          "type": "string",
          "configurable": false,
          "track_changes": false,
          "visible": true
        },
        {
          "key": "domain",
          "type": "string",
          "configurable": false,
          "track_changes": false,
          "visible": true
        }
      ]
    }
  ],
  "result": {"data": [{"label": "external_id", "value": "external_id"}, {"label": "domain", "value": "domain"}], "status": 200}
};


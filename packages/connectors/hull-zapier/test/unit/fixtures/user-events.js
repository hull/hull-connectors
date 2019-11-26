
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
      "subscriptions": []
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
        "entityType": "user_event"
      }
    }
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "getUserEvents",
      "result": [
        {
          "app_ids": [
            "1"
          ],
          "created_at": "2019-08-27T18:46:22Z",
          "name": "Email Opened",
          "properties": [],
          "sources": [
            "hubspot"
          ],
          "updated_at": "2019-09-04T20:55:44Z",
          "emitted": true
        },
        {
          "app_ids": [
            "1"
          ],
          "created_at": "2019-08-27T18:46:22Z",
          "name": "Email Sent",
          "properties": [],
          "sources": [
            "hubspot"
          ],
          "updated_at": "2019-09-04T20:55:44Z",
          "emitted": true
        },
        {
          "app_ids": [
            "1"
          ],
          "created_at": "2019-08-27T18:46:22Z",
          "name": "Email Dropped",
          "properties": [],
          "sources": [
            "hubspot"
          ],
          "updated_at": "2019-09-04T20:55:44Z",
          "emitted": true
        }
      ]
    }
  ],
  "result": {"data": [{"label": "Email Opened", "value": "Email Opened"}, {"label": "Email Sent", "value": "Email Sent"}, {"label": "Email Dropped", "value": "Email Dropped"}], "status": 200}
};


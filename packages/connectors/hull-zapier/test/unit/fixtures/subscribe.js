
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
  "route": "subscribe",
  "input": {
    "classType": {
      "service_name": "incoming_webpayload",
      "name": "WebPayload"
    },
    "context": {},
    "data": {}
  },
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "settingsUpdate",
      "input": {},
      "result": {}
    }
  ],
  "result": expect.anything()
};

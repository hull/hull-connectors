
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
  "route": "segments",
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
      "op": "getUserSegments",
      "result": [
        {
          "id": "1",
          "name": "UserSegment1",
          "query": {},
          "type": "users_segment",
          "predicate": {},
          "stats": {},
          "created_at": "2019-05-01T11:58:56Z",
          "updated_at": "2019-09-16T06:52:09Z",
          "fields_list": [],
          "referenced_attributes": [],
          "referenced_events": [],
          "version": {}
        },
        {
          "id": "2",
          "name": "UserSegment2",
          "query": {},
          "type": "users_segment",
          "predicate": {},
          "stats": {},
          "created_at": "2019-05-01T11:58:56Z",
          "updated_at": "2019-09-16T06:52:09Z",
          "fields_list": [],
          "referenced_attributes": [],
          "referenced_events": [],
          "version": {}
        }
      ]
    }
  ],
  "result": {"data": [{"label": "UserSegment1", "value": "1"}, {"label": "UserSegment2", "value": "2"}], "status": 200}
};


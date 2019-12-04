module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
      "type": "postgres",
      "db_port": 5432,
      "synchronized_user_segments": [],
      "send_all_user_attributes": true,
      "send_all_account_attributes": true,
      "synchronized_account_segments": [],
      "db_user_table_name": "hullusers",
      "db_events_table_name": "hullevents",
      "db_account_table_name": "hullaccounts"
    }
  },
  "route": "userUpdate",
  "input": [
    {
      "user": {
        "external_id": "merge_me2",
        "id": "5d6e70300d2d76fd03000030",
        "email": "ccc.ccc@ccc.com",
        "traits_ccc": true,
        "domain": "ccc.com",
        "indexed_at": "2019-09-05T12:15:04Z",
        "traits_ddd": true,
        "created_at": "2019-09-03T13:52:48Z",
        "is_approved": false,
        "segment_ids": [
          "5d5156f429313f7def0000b7"
        ]
      },
      "changes": {
        "is_new": false,
        "user": {
          "traits_ddd": [
            null,
            true
          ]
        },
        "account": {},
        "segments": {},
        "account_segments": {}
      },
      "account": {},
      "segments": [
        {
          "id": "5d5156f429313f7def0000b7",
          "name": "Users with email",
          "updated_at": "2019-08-31T01:54:19Z",
          "type": "users_segment",
          "created_at": "2019-08-12T12:09:24Z"
        }
      ],
      "events": [
        {
          "properties": {
            "user_id": "5d6e70300d2d76fd03000030",
            "merged_anonymous_ids": [],
            "merged_email": "ddd.ddd@ddd.com",
            "user_email": "ccc.ccc@ccc.com",
            "user_anonymous_ids": [],
            "user_external_id": "merge_me2",
            "merged_id": "5d70fa9567e16ef8ff000245",
            "merged_external_id": null
          },
          "event_id": "5d6e70300d2d76fd03000030:5d70fa9567e16ef8ff000245:merged",
          "user_id": "5d6e70300d2d76fd03000030",
          "event_source": "hull",
          "event": "User merged",
          "event_type": "user_merged",
          "context": {},
          "created_at": "2019-09-05T12:14:49Z",
          "notify": true
        }
      ],
      "account_segments": [],
      "update_id": "250532ec.hullbeta.io:std:317",
      "message_id": "7e683d1ee02f4a916dd14b2fe1087a82e7330d2f"
    }
  ],
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "postgresJdbc",
      "op": "mergeHullUser",
      "input": { previous: "5d6e70300d2d76fd03000030", merged: "5d70fa9567e16ef8ff000245" },
      "result": {}
    }
  ],
  "result": {
    hullDispatcherStatus: "stop"
  }
};

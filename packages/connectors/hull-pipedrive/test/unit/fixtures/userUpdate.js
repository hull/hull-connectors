module.exports = {
  "configuration": {
    "id": "5c092905c36af496c700012e",
    "secret": "shhh",
    "organization": "organization.hullapp.io",
    "hostname": "connectortest.connectordomain.io",
    "private_settings": {
      "support_user_deletion": false,
      "token_expires_in": 3599,
      "outgoing_user_attributes": [
        {
          "hull": "closeio/title",
          "service": "cdc21f9aa3c569bd612dd1868de86d66d901219b"
        },
        {
          "hull": "created_at",
          "service": "8be0418496871a1103ce8cf90f6ee0add3537466"
        },
        {
          "hull": "somenumber",
          "service": "82a4d3cb99b241cb4a5cfa12218f31b0ceabe865"
        },
        {
          "hull": "created_at",
          "service": "58c39f7990bbdbfbb202b42143c6b5cd13586f1f"
        },
        {
          "hull": "closeio/title",
          "service": "111a6ac0bd7a632eb5f13bc67288da8a72c0ce27"
        }
      ],
      "user_claims": [
        {
          "hull": "email",
          "service": "email"
        }
      ],
      "access_token": "access_token",
      "refresh_token": "refresh_token",
      "outgoing_account_attributes": [],
      "synchronized_user_segments": [],
      "webhook_id_org": 87908,
      "ignore_deleted_accounts": true,
      "link_users_in_service": false,
      "ignore_deleted_users": true,
      "expires_in": 3599,
      "support_account_deletion": false,
      "account_claims": [
        {
          "hull": "domain",
          "service": "name"
        }
      ],
      "webhook_id_person": 87907,
      "synchronized_account_segments": [],
      "link_users_in_hull": false
    }
  },
  "route": "userUpdate",
  "input": {
    "data": [
      {
        "user": {
          "pipedrive/id": 20,
          "id": "5c54819ff441416d9c059af4",
          "email": "pepper@stark.com",
          "name": "Pepper potts",
          "hubspot/id": 101,
          "created_at": "2019-02-01T17:27:59Z",
          "closeio/title": "ceo"
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
      "localContext": expect.anything(),
      "name": "pipedrive",
      "op": "updatePerson",
      "input": {
        "name": "Pepper potts",
        "cdc21f9aa3c569bd612dd1868de86d66d901219b": "ceo",
        "8be0418496871a1103ce8cf90f6ee0add3537466": "2019-02-01T17:27:59Z",
        "58c39f7990bbdbfbb202b42143c6b5cd13586f1f": "2019-02-01T17:27:59Z",
        "111a6ac0bd7a632eb5f13bc67288da8a72c0ce27": "ceo"
      },
      "result": {
        "status": 200,
        "text": "{\"success\":true,\"data\":{\"id\":20,\"company_id\":6932609,\"owner_id\":{\"id\":10358676,\"name\":\"Louis Jahn\",\"email\":\"louis+pipedrive_sandbox@hull.io\",\"has_pic\":false,\"pic_hash\":null,\"active_flag\":true,\"value\":10358676},\"org_id\":null,\"name\":\"Pepper potts\",\"first_name\":\"Pepper\",\"last_name\":\"potts\",\"open_deals_count\":0,\"related_open_deals_count\":0,\"closed_deals_count\":0,\"related_closed_deals_count\":0,\"participant_open_deals_count\":0,\"participant_closed_deals_count\":0,\"email_messages_count\":0,\"activities_count\":0,\"done_activities_count\":0,\"undone_activities_count\":0,\"reference_activities_count\":0,\"files_count\":0,\"notes_count\":0,\"followers_count\":1,\"won_deals_count\":0,\"related_won_deals_count\":0,\"lost_deals_count\":0,\"related_lost_deals_count\":0,\"active_flag\":true,\"phone\":[{\"value\":\"\",\"primary\":true}],\"email\":[{\"label\":\"\",\"value\":\"pepper@stark.com\",\"primary\":true}],\"first_char\":\"p\",\"update_time\":\"2019-10-22 12:58:52\",\"add_time\":\"2019-10-21 21:49:52\",\"visible_to\":\"3\",\"picture_id\":null,\"next_activity_date\":null,\"next_activity_time\":null,\"next_activity_id\":null,\"last_activity_id\":null,\"last_activity_date\":null,\"last_incoming_mail_time\":null,\"last_outgoing_mail_time\":null,\"label\":null,\"cdc21f9aa3c569bd612dd1868de86d66d901219b\":\"ceo\",\"111a6ac0bd7a632eb5f13bc67288da8a72c0ce27\":\"9\",\"58c39f7990bbdbfbb202b42143c6b5cd13586f1f\":\"2019-02-01\",\"82a4d3cb99b241cb4a5cfa12218f31b0ceabe865\":null,\"82a4d3cb99b241cb4a5cfa12218f31b0ceabe865_currency\":null,\"8be0418496871a1103ce8cf90f6ee0add3537466\":\"17:27:59\",\"8be0418496871a1103ce8cf90f6ee0add3537466_timezone_id\":151,\"org_name\":null,\"cc_email\":\"hull-dev-sandbox-961195@pipedrivemail.com\"},\"related_objects\":{\"user\":{\"10358676\":{\"id\":10358676,\"name\":\"Louis Jahn\",\"email\":\"louis+pipedrive_sandbox@hull.io\",\"has_pic\":false,\"pic_hash\":null,\"active_flag\":true}}}}"
      }
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {
        "ident": {
          "anonymous_id": "pipedrive:20",
          "email": "pepper@stark.com"
        },
        "attributes": {
          "pipedrive/id": {
            "value": 20,
            "operation": "set"
          }
        }
      },
      "result": {}
    }
  ],
  "result": expect.anything()
};
